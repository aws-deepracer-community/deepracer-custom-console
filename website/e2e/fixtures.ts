/* eslint-disable @typescript-eslint/no-explicit-any */
import { test as base, expect } from "@playwright/test";

// Shared function to set up all common API mocks
async function setupCommonMocks(page: any) {
  await page.route("**/api/get_battery_level", async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        battery_level: 8,
      }),
    });
  });

  await page.route("**/api/get_sensor_status", async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        camera_status: "connected",
        lidar_status: "not_connected",
        stereo_status: "not_connected",
      }),
    });
  });

  await page.route("**/api/supported_apis", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        apis_supported: [
          "/api/adjust_calibrating_wheels/<cali_type>",
          "/api/available_wifi_info",
          "/api/begin_software_update",
          "/api/control_modes_available",
          "/api/deleteModels",
          "/api/disableSsh",
          "/api/drive_mode",
          "/api/emergency_stop",
          "/api/enableSsh",
          "/api/get_battery_level",
          "/api/get_calibration/<cali_type>",
          "/api/get_device_info",
          "/api/get_device_status",
          "/api/get_led_color",
          "/api/get_mandatory_update_status",
          "/api/get_network_details",
          "/api/get_sensor_status",
          "/api/get_time",
          "/api/isModelLoading",
          "/api/isSshDefaultPasswordChanged",
          "/api/isSshEnabled",
          "/api/is_model_installed",
          "/api/is_software_update_available",
          "/api/is_usb_connected",
          "/api/logs/<log_type>/<int:num_lines>",
          "/api/manual_drive",
          "/api/max_nav_throttle",
          "/api/models",
          "/api/models/<model_folder_name>/<model_name>",
          "/api/password",
          "/api/resetSshPassword",
          "/api/server_ready",
          "/api/set_calibration/<cali_type>",
          "/api/set_calibration_mode",
          "/api/set_led_color",
          "/api/set_mandatory_update_status",
          "/api/set_timezone",
          "/api/start_stop",
          "/api/supported_apis",
          "/api/update_status",
          "/api/uploadModels",
          "/api/uploaded_model_list",
          "/api/wifi_reset",
        ],
      }),
    });
  });

  // Mock CSRF token endpoint
  await page.route("**/redirect_login", async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: "text/plain",
      body: "csrf-token-123",
    });
  });

  // Mock device info API
  await page.route("**/api/get_device_info", async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        cpu_model: "Intel Atom Processor E3930 @ 1.30GHz",
        disk_amount: "29GB",
        hardware_version: "DeepRacer R2.1",
        os_version: "Ubuntu 20.04.6 LTS",
        ram_amount: "4GB",
        ros_distro: "ROS2 Foxy",
        software_version: "2.1.9.0+community1-focal",
        success: true,
      }),
    });
  });

  // Mock car state API
  await page.route("**/api/get_car_state", async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        car_state: "stopped",
      }),
    });
  });

  // Mock models API
  await page.route("**/api/models", async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        models: [
          {
            is_select_disabled: false,
            model_action_space_type: "Discrete",
            model_folder_name: "Sample_single_cam",
            model_name: "model",
            model_sensors: ["Camera"],
            model_training_algorithm: "Clipped PPO",
          },
          {
            is_select_disabled: true,
            model_action_space_type: "Discrete",
            model_folder_name: "Sample_lidar_stereo_cam",
            model_name: "model",
            model_sensors: ["LiDAR", "Stereo camera"],
            model_training_algorithm: "Clipped PPO",
          },
          {
            is_select_disabled: true,
            model_action_space_type: "Discrete",
            model_folder_name: "Sample_stereo_cam",
            model_name: "model",
            model_sensors: ["Stereo camera"],
            model_training_algorithm: "Clipped PPO",
          },
        ],
        sensor_status: {
          camera_status: "connected",
          lidar_status: "not_connected",
          stereo_status: "not_connected",
        },
      }),
    });
  });

  // Mock uploaded model list endpoint
  await page.route("**/api/uploaded_model_list", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          action_space_type: "Discrete",
          creation_time: 1744232425.0534956,
          name: "Sample_lidar_stereo_cam",
          sensors: "LiDAR, Stereo camera",
          size: "24M",
          status: "Ready",
          training_algorithm: "Clipped PPO",
        },
        {
          action_space_type: "Discrete",
          creation_time: 1750542045.4351265,
          name: "Sample_single_cam",
          sensors: "Camera",
          size: "45M",
          status: "Ready",
          training_algorithm: "Clipped PPO",
        },
        {
          action_space_type: "Discrete",
          creation_time: 1744232425.0534956,
          name: "Sample_stereo_cam",
          sensors: "Stereo camera",
          size: "23M",
          status: "Ready",
          training_algorithm: "Clipped PPO",
        },
      ]),
    });
  });

  // Mock models API
  await page.route("**/api/isModelLoading", async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        isModelLoading: "error",
      }),
    });
  });

  // Mock network status endpoint
  await page.route("**/api/get_network_details", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        SSID: "TestNetwork",
        ip_address: "192.168.1.100",
        is_usb_connected: false,
      }),
    });
  });

  // Mock Drive Mode
  await page.route("**/api/drive_mode", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
      }),
    });
  });

  // Mock Start/Stop Mode
  await page.route("**/api/start_stop", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
      }),
    });
  });

  // Calibration
  await page.route("**/api/get_calibration/<cali_type>", async (route) => {
    const caliType = route.request().url().split("/").slice(-1)[0];

    if (!["angle", "speed"].includes(caliType)) {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          message: "Invalid calibration type",
        }),
      });
      return;
    }

    // Mock calibration data based on type
    if (caliType === "angle") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ max: 20.0, mid: -5.0, min: -30.0, polarity: 1, success: true }),
      });
    }

    if (caliType === "throttle") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ max: 23.0, mid: -12.0, min: -42.0, polarity: -1, success: true }),
      });
    }
  });

  await page.route("**/api/set_calibration_mode", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
      }),
    });
  });

  // Load Model
  await page.route("**/api/models/*/model", async (route) => {
    const modelName = route.request().url().split("/").slice(-2)[0];
    console.log("Load Model Request:", {
      modelName,
      method: route.request().method(),
      url: route.request().url(),
    });
    if (modelName === "Sample_single_cam") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
        }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
        }),
      });
    }
  });

  // Handle login endpoint for authentication
  await page.route("**/login", async (route: any) => {
    // If running in WebKit, manually set the cookie before login POST
    if (test.info().project.name === "webkit" || test.info().project.name === "Mobile Safari") {
      await page.context().addCookies([
        {
          name: "deepracer_token",
          value: "test-auth-token",
          domain: "localhost",
          path: "/",
          httpOnly: false,
          secure: false,
        },
      ]);
    }

    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "text/plain",
        body: JSON.stringify({ redirect: "/home" }),
        headers: {
          // Set-Cookie header to embed the cookie in the response
          "Set-Cookie": "deepracer_token=test-auth-token; Path=/; Domain=localhost",
        },
      });
    } else {
      await route.continue();
    }
  });
}

// Default test fixture with authentication cookie
export const test = base.extend({
  page: async ({ page }, use) => {
    // Set up authentication cookie for protected routes by default
    await page.context().addCookies([
      {
        name: "deepracer_token",
        value: "test-auth-token",
        domain: "localhost",
        path: "/",
        httpOnly: false,
        secure: false,
      },
    ]);

    // Mock common API endpoints for all tests
    await setupCommonMocks(page);

    await use(page);
  },
});

// Special test fixture for authentication tests (no auth cookie)
export const authTest = base.extend({
  page: async ({ page }, use) => {
    // Do NOT set authentication cookie for auth tests

    // Mock common API endpoints for auth tests too
    await setupCommonMocks(page);

    await use(page);
  },
});

export { expect };
