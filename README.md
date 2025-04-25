# DeepRacer Custom Console

## Introduction

The DeepRacer Custom Console is a community-developed web interface for AWS DeepRacer vehicles that replaces the standard manufacturer UI. This project provides an enhanced user experience with a modern Cloudscape-based interface for controlling and managing your DeepRacer car.

Developed by the AWS DeepRacer Community, this custom console offers an alternative way to interact with your DeepRacer, making it ideal for enthusiasts looking to customize their racing experience.

### Key Features

- Modern Cloudscape UI design
- Simple installation via Debian package or provided scripts
- Easily reversible - restore the original console when needed
- Open-source and community-supported
- Fully customizable for developers

Whether you're a casual racer or a DeepRacer developer, this custom console provides an improved interface for managing your car while maintaining all the functionality of the original system.

## How to install on your car

### Using Debian Package

- Find the latest release - https://github.com/aws-deepracer-community/deepracer-custom-console/releases
- SSH to your car
- Run `curl -L -o deepracer-console-new.deb https://github.com/aws-deepracer-community/deepracer-custom-console/releases/download/v2.2.9/aws-deepracer-community-device-console_2.2.9.0_all.deb`
- Run `sudo dpkg -i deepracer-console-new.deb`
- Run `sudo systemctl restart deepracer-core.service` to restart the DeepRacer service
- Open your browser and navigate to the IP address of the car and login using your password

If you should need to restore the original UI run:
- `sudo apt remove aws-deepracer-community-device-console`
- `sudo apt install aws-deepracer-device-console`

Note - some features also require the deepracer-custom-car code - https://github.com/aws-deepracer-community/deepracer-custom-car
- Follow the instructions in that repo to install
- If some features require the 'experimental' custom-car-code then update your car with the following config
    -  Run `sudo vi /etc/apt/sources.list.d/aws_deepracer-community.list` and then comment out the first line and uncomment the third line
    -  Run `sudo apt update && sudo apt upgrade`
    - Run `sudo systemctl restart deepracer-core.service` to restart the DeepRacer service

## Development Guide

### Development Environment Setup

**On your development machine (can be the car or separate):**
1. Clone the repository: `git clone https://github.com/aws-deepracer-community/deepracer-custom-console`
2. Navigate to the website directory: `cd deepracer-custom-console/website`
3. Install project dependencies: `npm install`
4. Set environment variable for your car: `export CAR_IP=<your-car-ip-address>`
5. Start the development server: `npm run dev`
   - The server will be available at http://localhost:3000

### API Access Configuration

**On the DeepRacer car:**
1. SSH into your car
2. Edit the webserver configuration file:
   ```bash
   sudo nano /opt/aws/deepracer/lib/webserver_pkg/lib/python3.8/site-packages/webserver_pkg/webserver.py
   ```
3. Add `WTF_CSRF_ENABLED=False,` to the `app.config.update` method at the end of the file
4. Restart the DeepRacer service: `sudo systemctl restart deepracer-core.service`

### Development Workflow

1. **Make Changes:**
   - Add/modify files in `public/static` (images, assets, etc.)
   - Update navigation in `src/components/navigation-panel.tsx`
   - Add or modify pages in `src/pages`
   - Update routing in `src/app.tsx`
   - Test functionality in your browser

2. **Test Your Changes:**
   - Create a release build: `npm run build`
   - Deploy to the car (see above for instructions)
   - Test the functionality in your browser

3. **Submit Your Contribution:**
   - Commit your changes and push to your fork
   - Create a pull request for review

4. **Package Creation (Optional):**
   - Create your own Debian package with `./deepracer-build-pkg.sh`

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
