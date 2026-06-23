# Cyber Notification Frontend

# Local testing
```bash
cd cynos-frontend

# This will create all necessary resources on AWS. The frontend
# will connect to those resources. This command needs to be repeated
# when the backend code has changed.
# 
# Resources can be removed with
#   $ npm ampx sanbox delete
npx ampx sandbox

# run the backend server in dev mode
npm run dev
```

## Cognito
In order to use password authentication, which is currently the only option,
this must be enabled in Cognito.
```
AWS Console
 -> Cognito
   -> User Pools, select the User Pool
     -> App Clients, select the App Client
       -> Edit
         -> Enable "ALLOW_USER_PASSWORD_AUTH"
```

# Testing for deployment
Before pushing into github, it is advised to run the deployment build process
manually. Otherwise the build may fail on AWS Amplify and has to be debugged
there. This can be anoying, especially when there are (stacked) Typescript
errors.

To run the deployment build locally
```
cd cynos-frontend
npm ci
npm run build
```

# Project creation
This is for reference.
```bash
# Create the frontend
npm create vite@latest
# project-name: cynos-frontend
# framework: vanilla
cd cynos-frontend
npm install

# Create the backend
npm create amplify@latest

# disable telemetry
npx ampx configure telemetry disable

# configure AWS services for local development
npx ampx sandbox

```
