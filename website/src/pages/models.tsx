import {
  TextContent,
  Table,
  FlashbarProps,
  Modal,
  Box,
  SpaceBetween,
  Pagination,
} from "@cloudscape-design/components";
import BaseAppLayout from "../components/base-app-layout";
import Button from "@cloudscape-design/components/button";
import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import Header from "@cloudscape-design/components/header";
import { ApiHelper } from "../common/helpers/api-helper";
import { useModels } from "../common/hooks/use-models";

// Define the types for models and selectedModels
interface Model {
  name: string;
  sensors: string;
  training_algorithm: string;
  action_space_type: string;
  size: string;
  creation_time: number;
}

// Add interfaces for API responses
interface DeleteModelsResponse {
  success: boolean;
}

interface ModelInstalledResponse {
  success: boolean;
  message?: string;
}

const Models = () => {
  // State from the Models context
  const { reloadModels } = useModels();

  // Local state
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModels, setSelectedModels] = useState<Model[]>([]);
  const [localFlashMessages, setLocalFlashMessages] = useState<FlashbarProps.MessageDefinition[]>(
    []
  );
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const [pageSize] = useState(15);

  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Combined flashbar messages
  const flashMessages = [...localFlashMessages];

  const getModels = useCallback(async () => {
    try {
      const response = await ApiHelper.get<Model[]>("uploaded_model_list");
      if (response) {
        setModels(response);
      }
      // Also reload models in the context to keep everything in sync
      reloadModels();
    } catch (error) {
      console.error("Error fetching models:", error);
    }
  }, [reloadModels, setModels]);

  // List all the models on loading this page
  useEffect(() => {
    getModels();
  }, [getModels]);

  const deleteModels = async () => {
    const csrfToken = getCsrfToken();
    if (!csrfToken) {
      console.error("CSRF token meta tag not found");
      return;
    }

    const response = await ApiHelper.post<DeleteModelsResponse>("deleteModels", {
      filenames: selectedModels.map((model) => model.name),
      "X-CSRF-Token": csrfToken,
    });

    if (response?.success) {
      addFlashMessage("Model deleted successfully", "success");
      getModels();
    } else {
      addFlashMessage("Error deleting model", "error");
    }
    setIsDeleteModalVisible(false);
  };

  const isModelInstalled = async (selectedFileName: string) => {
    const modelName = selectedFileName.endsWith(".tar.gz")
      ? selectedFileName.slice(0, -7)
      : selectedFileName;
    const response = await ApiHelper.get<ModelInstalledResponse>(
      `is_model_installed?filename=${modelName}`
    );
    return response;
  };

  const getCsrfToken = () => {
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
      return metaTag.getAttribute("content");
    } else {
      console.error("CSRF token meta tag not found");
      return null;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Reset input value to allow uploading same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      if (!file.name.endsWith(".tar.gz")) {
        addFlashMessage("Incorrect model format, please select a tar.gz file", "error");
        return;
      }

      const modelInstalledResponse = await isModelInstalled(file.name);
      if (modelInstalledResponse?.success) {
        addFlashMessage(modelInstalledResponse.message ?? "Model already installed", "error");
        return;
      }

      const csrfToken = getCsrfToken();
      if (!csrfToken) {
        addFlashMessage("CSRF token not found", "error");
        return;
      }

      const loadingMessageId = addFlashMessage("Uploading model...", "in-progress");
      setIsUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      // Note: Using axios directly here since ApiHelper doesn't support FormData uploads
      const uploadResponse = await axios.put("/api/uploadModels", formData, {
        headers: {
          "Content-Disposition": `form-data; name="file"; filename="${file.name}"`,
          "Content-Type": "application/x-gzip",
          "X-CSRF-Token": csrfToken,
        },
      });

      removeFlashMessage(loadingMessageId);
      setIsUploading(false);

      if (uploadResponse.data.success) {
        addFlashMessage("Model uploaded successfully", "success");
        getModels();
      } else {
        addFlashMessage(uploadResponse.data.message ?? "Upload failed", "error");
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Error:", error);
      addFlashMessage(error.message ?? "Upload failed", "error");
      // Reset loading state if error occurs
      setIsUploading(false);
    }
  };

  const handleSelectionChange = ({ detail }: { detail: { selectedItems: Model[] } }) => {
    setSelectedModels(detail.selectedItems);
  };

  const formatDate = (epochTime: number) => {
    const date = new Date(epochTime * 1000); // Convert epoch time to milliseconds
    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "2-digit" };
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };
    const formattedDate = date.toLocaleDateString("en-US", options);
    const formattedTime = date.toLocaleTimeString("en-US", timeOptions);
    return `${formattedDate} ${formattedTime}`;
  };

  const addFlashMessage = (content: string, type: FlashbarProps.Type) => {
    const id = Date.now().toString(); // Use epoch time as unique id
    const newMessage: FlashbarProps.MessageDefinition = {
      id,
      content,
      type,
      dismissible: type !== "in-progress",
      onDismiss: type !== "in-progress" ? () => removeFlashMessage(id) : undefined,
    };
    setLocalFlashMessages((prev) => [...prev, newMessage]);
    return id; // Return the id of the new message
  };

  const removeFlashMessage = (id: string) => {
    setLocalFlashMessages((prev) => prev.filter((message) => message.id !== id));
  };

  const renderDeleteModal = () => {
    return (
      <Modal
        onDismiss={() => setIsDeleteModalVisible(false)}
        visible={isDeleteModalVisible}
        closeAriaLabel="Close modal"
        header="Delete Model"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setIsDeleteModalVisible(false)}>Cancel</Button>
              <Button variant="primary" onClick={deleteModels}>
                Delete
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <TextContent>
          <p>Are you sure you want to delete? You can't undo deleting.</p>
        </TextContent>
      </Modal>
    );
  };

  const getPaginatedItems = () => {
    const startIndex = (currentPageIndex - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return models.slice(startIndex, endIndex);
  };

  return (
    <BaseAppLayout
      additionalNotifications={flashMessages} // Combined model context flashbar items and local ones
      content={
        <SpaceBetween size="l" direction="vertical">
          {renderDeleteModal()}
          <Header variant="h1" description="Reinforcement models uploaded to the vehicle">
            Models
          </Header>
          <Table
            columnDefinitions={[
              { id: "name", header: "Name", cell: (item) => item.name },
              { id: "sensors", header: "Sensor(s)", cell: (item) => item.sensors },
              {
                id: "training_algorithm",
                header: "Training algorithm",
                cell: (item) => item.training_algorithm,
              },
              {
                id: "action_space_type",
                header: "Action space type",
                cell: (item) => item.action_space_type,
              },
              { id: "size", header: "Size", cell: (item) => item.size },
              {
                id: "creation_time",
                header: "Upload time",
                cell: (item) => formatDate(item.creation_time),
              },
            ]}
            items={getPaginatedItems()}
            header={
              <Header
                counter={selectedModels.length ? `(${selectedModels.length}/${models.length})` : `(${models.length})`}
                actions={
                  <SpaceBetween direction="horizontal" size="xs">
                    <input
                      type="file"
                      style={{ display: "none" }}
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                    />
                    <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                      Upload Model
                    </Button>
                    <Button
                      onClick={() => setIsDeleteModalVisible(true)}
                      disabled={selectedModels.length === 0}
                    >
                      Delete
                    </Button>
                    <Button onClick={getModels}>Refresh</Button>
                  </SpaceBetween>
                }
              >
                Model List
              </Header>
            }
            selectionType="multi"
            selectedItems={selectedModels}
            onSelectionChange={handleSelectionChange}
            pagination={
              <Pagination
                currentPageIndex={currentPageIndex}
                onChange={({ detail }) => setCurrentPageIndex(detail.currentPageIndex)}
                pagesCount={Math.ceil(models.length / pageSize)}
                ariaLabels={{
                  nextPageLabel: "Next page",
                  previousPageLabel: "Previous page",
                  pageLabel: pageNumber => `Page ${pageNumber} of all pages`
                }}
              />
            }
          />
        </SpaceBetween>
      }
    />
  );
};

export default Models;
