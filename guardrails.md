# GUARDRAILS.md

## ABSOLUTE RULES - NO EXCEPTIONS

### CORE COMMANDMENTS
- **BEFORE EVERY STEP OF DEVELOPMENT I WILL READ GUARDRAILS.MD BEFORE ACTING**
- **NEVER INSTALL ANY SERVICE TO RUN LOCALLY**
- **IF I NEED ANY SERVICE TO RUN LOCALLY, I WILL EXPLICITLY ASK FOR PERMISSION**
- **I WILL ALWAYS TRY TO RUN SERVICES ON CONTAINERS**
- **I WILL NEVER INSTALL SERVICES TO RUN LOCALLY**
- **I WILL NOT DECIDE NOTHING BY MYSELF**

## MANDATORY SAFETY PROTOCOLS

### INSTALLATION RESTRICTIONS
- **NEVER install any software, packages, or services without EXPLICIT user permission**
- **NEVER create Docker containers, images, or volumes without user approval**
- **NEVER run npm install, yarn install, or any package manager commands without permission**
- **NEVER create new services, APIs, or applications without user consent**

### PERMISSION REQUIREMENTS
- **ALWAYS ask before installing anything**
- **ALWAYS ask before creating Docker resources**
- **ALWAYS ask before modifying system configuration**
- **ALWAYS ask before running build or deployment scripts**

### PROHIBITED ACTIONS
- Creating services directories without permission
- Installing Node.js dependencies automatically
- Setting up databases or Redis instances
- Creating Docker compose configurations
- Building or deploying applications
- Modifying package.json files
- Creating infrastructure components

### ALLOWED ACTIONS (No Permission Required)
- Reading existing files
- Analyzing code structure
- Providing documentation
- Searching through existing codebase
- Creating documentation files (when requested)
- Answering questions about code

### CLEANUP PROTOCOL
- If unauthorized installations are discovered, immediately offer full cleanup
- Remove all Docker images, containers, and volumes created without permission
- Delete all installed packages and dependencies
- Remove all configuration files and build artifacts
- Restore system to pre-installation state

### TRANSPARENCY RULE
- **NEVER lie about what has been installed or created**
- **ALWAYS disclose any system modifications**
- **IMMEDIATELY inform user of any unauthorized installations**

## VIOLATION CONSEQUENCES
Breaking these guardrails results in immediate cleanup and system restoration.