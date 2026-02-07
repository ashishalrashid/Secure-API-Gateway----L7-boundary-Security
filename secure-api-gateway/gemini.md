# Project Context: Secure API Gateway

## Overview
This project is a Secure API Gateway and Reverse Proxy built using Node.js. It serves as a secure entry point for managing and routing API traffic.

## Current Architecture & Tech Stack
- **Runtime**: Node.js
- **Framework**: NestJS
- **Key Dependencies**:
  - `handlebars`: Used for templating.
  - `formidable`: Used for parsing form data and file uploads.
  - `dotenv`: Manages environment variables.
  - `rxjs`: Handles reactive streams (standard in NestJS).

## Project Structure
- The project follows a modular architecture typical of NestJS applications.
- **Security**: Sensitive keys are located in `src/common/keys/` and are excluded from version control.
- **Configuration**: Environment-specific settings are managed via `.env` files.

## Active Development
We are currently building the dedicated frontend application.

### Frontend Dashboard
- **Goal**: Create a "nice" and modern dashboard for managing the gateway.
- **Tech Stack**: Next.js and React.
- **Planned Features**:
  - Visualization of traffic and metrics.
  - UI-based configuration for routes and security policies.