import { useRef, useState } from 'react';
import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import UploadDropzone from './UploadDropzone';
import NewFolderModal from './NewFolderModal';
import * as foldersApi from '../services/foldersApi';

/**
 * Wraps every authenticated route. "New folder" and drag-and-drop upload
 * always target the CURRENT folder when browsing My Drive (via the
 * :folderId route param), and the Drive root otherwise — e.g. from the
 * Shared/Starred/Trash/Search pages, where creating content in-place
 * doesn't make sense, uploads land in the user's own root instead.
 */
export default function DriveLayout() {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();
  const { folderId: routeFolderId } = useParams();
  const [view, setView] = useState('grid');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const uploadInputRef = useRef(null);
  const queryClient = useQueryClient();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <p className="text-ink/40 font-mono text-sm">Loading…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  const activeFolderId = location.pathname.startsWith('/drive') ? (routeFolderId ?? null) : null;
  const folderQueryKey = ['folder', activeFolderId ?? 'root'];

  function invalidateFolder() {
    queryClient.invalidateQueries({ queryKey: folderQueryKey });
  }

  async function handleCreateFolder(name) {
    await foldersApi.createFolder({ name, parentId: activeFolderId });
    invalidateFolder();
  }

  return (
    <UploadDropzone folderId={activeFolderId} onUploaded={invalidateFolder} inputRef={uploadInputRef}>
      <div className="flex h-screen">
        <Sidebar
          user={user}
          onNewFolder={() => setShowNewFolder(true)}
          onUploadClick={() => uploadInputRef.current?.click()}
        />
        <div className="flex flex-col flex-1 min-w-0">
          <TopBar view={view} onViewChange={setView} />
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet context={{ view }} />
          </main>
        </div>
      </div>

      {showNewFolder && (
        <NewFolderModal onClose={() => setShowNewFolder(false)} onCreate={handleCreateFolder} />
      )}
    </UploadDropzone>
  );
}
