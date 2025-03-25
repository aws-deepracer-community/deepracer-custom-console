# deepracer-custom-console
Repo to work on the Cloudscape based DeepRacer console.


original folder contains the original code from the deepracer car: -

console - aws/deepracer/lib/device_console
nginx config - aws/deepracer/nginx/data

How to contribute: -

- Download repo and switch to 'website' folder
- Install project dependencies - ```'npm install'```
- Set environment variable ```'CAR_IP'``` to the IP address of your DeepRacer car, edit ```'/opt/aws/deepracer/lib/webserver_pkg/lib/python3.8/site-packages/webserver_pkg/webserver.py' ``` to add ```'WTF_CSRF_ENABLED=False,'``` to the method at the end of the file (app.config.update) and then restart the service ```'systemctl restart deepracer-core.service'```.
- SSH to your DeepRacer car, 
- Start development server - ```'run npm dev'``` it'll start on http://localhost:3000
- Perform development activity - it's likely you'll be adding or amending files in public/static (e.g adding images to /images), updating src/components/navigation-panel.tsx to add links to new pages, adding new pages to src/pages, or updating the page routing in src/app.tsx
- Perform a build to check it works - ```'npm run build'```
- Check in the code and raise a PR for review

How to install on your car: -

- Option 1 - Using Debian Package
    - Lars TODO

- Option 2 - Using scripts within this repo
    - Find the latest release - https://github.com/aws-deepracer-community/deepracer-custom-console/releases
    - ssh to your car
    - run ```'git clone https://github.com/aws-deepracer-community/deepracer-custom-console'```
    - run ```'cd deepracer-custom-console'```
    - run ```'curl -L -o deepracer-console-new.zip https://github.com/aws-deepracer-community/deepracer-custom-console/releases/download/v2.2.0/aws-deepracer-community-device-console-v2.2.0.zip'``` (or the latest tagged version you want to install) to download the zip package
    - run ```'sudo ./deepracer-backup-console.sh'``` to take a backup of the original UI
    - run ```'sudo ./deepracer-deploy-console.sh'``` to install the new Cloudscape UI
    - run ```'sudo systemctl restart deepracer-core.service'``` to restart the DeepRacer service
    - run ```'sudo systemctl restart nginx'``` to restart nginx
    - Open your browser and navigate to the IP address of the car and login using your password

If you should need to restore the original UI run ```'sudo ./deepracer-restore-console'```