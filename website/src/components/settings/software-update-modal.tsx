import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal, Box, SpaceBetween, Button, Alert } from "@cloudscape-design/components";
import { ApiHelper } from "../../common/helpers/api-helper";
import { SoftwareUpdateBeginResponse } from "../../common/types";

interface SoftwareUpdateModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export const SoftwareUpdateModal = ({ visible, onDismiss }: SoftwareUpdateModalProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  const handleConfirmUpdate = async () => {
    setIsUpdating(true);
    setError("");

    try {
      const response = await ApiHelper.get<SoftwareUpdateBeginResponse>("begin_software_update");
      if (response?.success) {
        // Close modal and navigate to update page
        onDismiss();
        navigate("/software-update");
      } else {
        setError(response?.reason || "Failed to start software update");
        setIsUpdating(false);
      }
    } catch (err) {
      console.error("Error starting software update:", err);
      setError("Unable to start software update. Please try again.");
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    if (!isUpdating) {
      onDismiss();
    }
  };

  return (
    <Modal
      onDismiss={handleCancel}
      visible={visible}
      closeAriaLabel="Close modal"
      size="medium"
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={handleCancel} disabled={isUpdating}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmUpdate} loading={isUpdating}>
              Start Update
            </Button>
          </SpaceBetween>
        </Box>
      }
      header="Confirm Software Update"
    >
      <SpaceBetween direction="vertical" size="m">
        {error && (
          <Alert type="error" dismissible onDismiss={() => setError("")}>
            {error}
          </Alert>
        )}

        <Box>Are you sure you want to start the software update? This process will:</Box>

        <Box>
          <ul>
            <li>Download and install the latest software</li>
            <li>Reboot your AWS DeepRacer device</li>
            <li>Take several minutes to complete</li>
          </ul>
        </Box>

        <Alert type="warning">
          <strong>Important:</strong> Do not power off the device during the update process. This
          could damage your device.
        </Alert>
      </SpaceBetween>
    </Modal>
  );
};
