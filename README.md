# deepracer-custom-console
Repo to work on the Cloudscape bases DeepRacer console.  Consider a draft WIP, content likely to be subsumed into another repo in future

original folder contains the original code from the deepracer car: -

console - aws/deepracer/lib/device_console
nginx config - aws/deepracer/nginx/data

new folder is work in progress development for a Cloudscape based new UI

How to contribute: -

- Download repo and switch to 'new' folder
- Install project dependencies - ```'npm install'```
- Start development server - ```'run npm dev'``` it'll start on http://localhost:3000
- Perform development activity - it's likely you'll be adding or amending files in public/static (e.g adding images to /images), updating src/components/navigation-panel.tsx to add links to new pages, adding new pages to src/pages, or updating the page routing in src/app.tsx
- Note - if you want to connect to a DeepRacer car to test API functionality then get the IP address allocated to your DeepRacer car and amend vite.config.ts to use that IP Address in the proxy settings.  On launching the development server you'll need to go to http://localhost:3000/login to authenticate using the car's password.  Some functionality that returns info from the car (e.g. logs) works with no car amendments, however functionality that amends the car (e.g. uploading models etc. is subject to additional security (csrf)), which needs disabling on the car during development - on the car edit '/opt/aws/deepracer/lib/webserver_pkg/lib/python3.8/site-packages/webserver_pkg/webserver.py' to add 'WTF_CSRF_ENABLED=False,' to the method at the end of the file (app.config.update) and then restart the service ```'systemctl restart deepracer-core.service'```.  Model upload and other amending functionality should then work from your local dev server to the car
- Perform a build to check it works - ```'npm run build'```
- Check in the code and raise a PR for review
