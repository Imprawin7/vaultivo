/**
 * Business logic layer. Services orchestrate repositories, enforce
 * permission rules, and coordinate storage (S3) operations. Controllers
 * should never talk to repositories directly — always go through a service.
 */
package com.vaultivo.service;
