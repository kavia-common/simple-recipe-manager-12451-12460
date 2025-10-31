#!/bin/bash
cd /tmp/kavia/workspace/code-generation/simple-recipe-manager-12451-12460/frontend_app
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

