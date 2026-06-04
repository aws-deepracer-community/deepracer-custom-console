# Requirements Document

## Introduction

The DeepRacer Custom Console is a community-developed web interface for AWS DeepRacer vehicles that replaces the standard manufacturer UI. This project provides an enhanced user experience with a modern Cloudscape-based interface for controlling and managing DeepRacer cars. The system enables users to control their vehicle remotely, manage AI models, calibrate sensors, view system logs, and configure network settings through a responsive web application.

## Requirements

### Requirement 1: User Authentication and Session Management

**User Story:** As a DeepRacer owner, I want to securely authenticate to my vehicle's console so that only authorized users can control my car.

#### Acceptance Criteria

1. WHEN a user accesses the console without authentication THEN the system SHALL redirect them to the login page
2. WHEN a user provides valid credentials THEN the system SHALL create an authenticated session with a deepracer_token cookie
3. WHEN a user's session expires or they logout THEN the system SHALL clear authentication tokens and redirect to login
4. WHEN an authenticated user navigates to protected routes THEN the system SHALL allow access without re-authentication
5. IF a user attempts to access protected routes without valid authentication THEN the system SHALL redirect to the login page

### Requirement 2: Vehicle Control Interface

**User Story:** As a DeepRacer operator, I want to control my vehicle's movement and speed through an intuitive interface so that I can drive it manually or test its behavior.

#### Acceptance Criteria

1. WHEN a user accesses the control interface THEN the system SHALL display a joystick component for directional control
2. WHEN a user moves the joystick THEN the system SHALL send real-time steering and throttle commands to the vehicle
3. WHEN a user adjusts the throttle setting THEN the system SHALL limit the maximum speed according to the selected value
4. WHEN a user clicks the emergency stop button THEN the system SHALL immediately halt the vehicle and reset its state
5. IF the vehicle supports emergency stop functionality THEN the system SHALL display the emergency stop button
6. WHEN a user starts or stops the vehicle THEN the system SHALL send appropriate start_stop commands to the vehicle API

### Requirement 3: AI Model Management

**User Story:** As a DeepRacer developer, I want to upload, manage, and deploy AI models to my vehicle so that I can test different autonomous driving behaviors.

#### Acceptance Criteria

1. WHEN a user accesses the models page THEN the system SHALL display a table of all available models with their metadata
2. WHEN a user uploads a new model file THEN the system SHALL validate the file format and install it on the vehicle
3. WHEN a user selects models for deletion THEN the system SHALL prompt for confirmation before removing them
4. WHEN a user deletes models THEN the system SHALL remove the selected models from the vehicle storage
5. WHEN model operations complete THEN the system SHALL display success or error messages to inform the user
6. WHEN a user starts inference mode THEN the system SHALL activate autonomous driving using the selected model
7. IF a model upload fails THEN the system SHALL display appropriate error messages with failure reasons

### Requirement 4: Vehicle Calibration System

**User Story:** As a DeepRacer technician, I want to calibrate my vehicle's steering and speed controls so that it operates accurately and safely.

#### Acceptance Criteria

1. WHEN a user accesses the calibration page THEN the system SHALL display options for steering and speed calibration
2. WHEN a user initiates steering calibration THEN the system SHALL guide them through center, left, and right position setup
3. WHEN a user initiates speed calibration THEN the system SHALL guide them through forward, backward, and stopped position setup
4. WHEN calibration is in progress THEN the system SHALL display real-time calibration values (min, max, mid, polarity)
5. WHEN a user completes calibration steps THEN the system SHALL save the calibration settings to the vehicle
6. WHEN calibration mode is active THEN the system SHALL put the vehicle in calibration mode via the API
7. IF calibration fails THEN the system SHALL display error messages and allow retry

### Requirement 5: System Monitoring and Status Display

**User Story:** As a DeepRacer operator, I want to monitor my vehicle's status and sensor readings so that I can ensure it's operating properly.

#### Acceptance Criteria

1. WHEN a user views any page THEN the system SHALL display current battery level with a progress indicator
2. WHEN the battery level is critically low or disconnected THEN the system SHALL show error status and warning messages
3. WHEN a user views the navigation panel THEN the system SHALL display network SSID and IP addresses
4. WHEN a user accesses the home page THEN the system SHALL show camera, stereo, and lidar sensor status
5. WHEN sensor status changes THEN the system SHALL update the display to reflect current connectivity
6. IF battery readings are unavailable after 10 seconds THEN the system SHALL display "Unable to get battery reading"
7. WHEN the system detects sensor errors THEN the system SHALL indicate "not_connected" status for affected sensors

### Requirement 6: Camera Feed and Visual Monitoring

**User Story:** As a DeepRacer operator, I want to view live camera feeds from my vehicle so that I can see what the car sees during operation.

#### Acceptance Criteria

1. WHEN a user enables camera feed THEN the system SHALL display live video stream from the vehicle's camera
2. WHEN a user selects camera feed type THEN the system SHALL switch between mono and stereo camera views
3. WHEN camera feed is active THEN the system SHALL maintain real-time video streaming with minimal latency
4. WHEN camera is not available THEN the system SHALL display appropriate status messages
5. IF camera feed fails to load THEN the system SHALL show error indicators and allow retry

### Requirement 7: System Logs and Diagnostics

**User Story:** As a DeepRacer developer, I want to access system logs and diagnostic information so that I can troubleshoot issues and monitor performance.

#### Acceptance Criteria

1. WHEN a user accesses the logs page THEN the system SHALL display recent system log entries
2. WHEN new log entries are generated THEN the system SHALL update the log display in real-time or on refresh
3. WHEN a user views logs THEN the system SHALL format them for easy reading with timestamps and severity levels
4. WHEN log data is unavailable THEN the system SHALL display appropriate error messages
5. IF logs are too large THEN the system SHALL implement pagination or scrolling for performance

### Requirement 8: Network Configuration Management

**User Story:** As a DeepRacer administrator, I want to configure network settings on my vehicle so that I can connect it to different WiFi networks and manage connectivity.

#### Acceptance Criteria

1. WHEN a user accesses network settings THEN the system SHALL display current network configuration
2. WHEN a user edits network settings THEN the system SHALL provide forms for SSID, password, and other network parameters
3. WHEN a user saves network changes THEN the system SHALL apply the new configuration to the vehicle
4. WHEN network configuration changes THEN the system SHALL validate settings before applying them
5. IF the vehicle is on deepracer.aws domain THEN the system SHALL redirect all routes to network update functionality
6. WHEN network update is in progress THEN the system SHALL show progress indicators and status messages

### Requirement 9: Software Update Management

**User Story:** As a DeepRacer owner, I want to update my vehicle's software through the web interface so that I can keep it current with the latest features and fixes.

#### Acceptance Criteria

1. WHEN a software update is available THEN the system SHALL display update notifications and options
2. WHEN a user initiates a software update THEN the system SHALL show progress indicators and status information
3. WHEN an update is in progress THEN the system SHALL display completion percentage and current status
4. WHEN an update completes successfully THEN the system SHALL show success confirmation and next steps
5. IF an update fails THEN the system SHALL display error messages and recovery options
6. WHEN the system is unavailable during updates THEN the system SHALL show a system unavailable page

### Requirement 10: Settings and Preferences Management

**User Story:** As a DeepRacer user, I want to configure application settings and preferences so that I can customize the interface to my needs.

#### Acceptance Criteria

1. WHEN a user accesses the settings page THEN the system SHALL display configurable options and preferences
2. WHEN a user changes settings THEN the system SHALL save preferences locally and apply them immediately
3. WHEN a user reloads the application THEN the system SHALL restore previously saved preferences
4. WHEN settings are invalid THEN the system SHALL show validation errors and prevent saving
5. IF settings reset is needed THEN the system SHALL provide options to restore default configurations