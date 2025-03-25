import { TextContent, Table, Flashbar, FlashbarProps, Modal, Box, SpaceBetween } from "@cloudscape-design/components";
import BaseAppLayout from "../components/base-app-layout";
import Button from "@cloudscape-design/components/button";
import * as React from "react";
import axios from "axios";
import Header from "@cloudscape-design/components/header";
import { ApiHelper } from '../common/helpers/api-helper';

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

interface State {
  models: Model[];
  selectedModels: Model[];
  flashMessages: FlashbarProps.MessageDefinition[];
  isDeleteModalVisible: boolean; // Add state for delete modal visibility
}

class Models extends React.Component<{}, State> {
  fileInput: HTMLInputElement | null = null;

  state: State = {
    models: [],
    selectedModels: [],
    flashMessages: [],
    isDeleteModalVisible: false // Add state for delete modal visibility
  };

  componentDidMount() {
    this.getModels();
  }

  getModels = async () => {
    try {
      const response = await ApiHelper.get<Model[]>('uploaded_model_list');
      if (response) {
        this.setState({ models: response });
      }
    } catch (error) {
      console.error("Error fetching models:", error);
    }
  };

  deleteModels = async () => {
    const csrfToken = this.getCsrfToken();
    if (!csrfToken) {
      console.error('CSRF token meta tag not found');
      return;
    }
    
    const response = await ApiHelper.post<DeleteModelsResponse>('deleteModels', {
      filenames: this.state.selectedModels.map(model => model.name),
      'X-CSRF-Token': csrfToken
    });

    if (response?.success) {
      this.addFlashMessage("Model deleted successfully", "success");
      this.getModels();
    } else {
      this.addFlashMessage("Error deleting model", "error");
    }
    this.setState({ isDeleteModalVisible: false });
  };

  isModelInstalled = async (selectedFileName: string) => {
    const modelName = selectedFileName.endsWith('.tar.gz') ? selectedFileName.slice(0, -7) : selectedFileName;
    const response = await ApiHelper.get<ModelInstalledResponse>(`is_model_installed?filename=${modelName}`);
    return response;
  };

  getCsrfToken = () => {
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
      return metaTag.getAttribute('content');
    } else {
      console.error('CSRF token meta tag not found');
      return null;
    }
  };

  handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".tar.gz")) {
      this.addFlashMessage("Incorrect model format, please select a tar.gz file", "error");
      return;
    }

    try {
      const modelInstalledResponse = await this.isModelInstalled(file.name);
      if (modelInstalledResponse?.success) {
        this.addFlashMessage(modelInstalledResponse.message ?? "Model already installed", "error");
        return;
      }

      const csrfToken = this.getCsrfToken();
      if (!csrfToken) {
        this.addFlashMessage("CSRF token not found", "error");
        return;
      }

      const loadingMessageId = this.addFlashMessage("Uploading model...", "in-progress");

      const formData = new FormData();
      formData.append("file", file);

      // Note: Using axios directly here since ApiHelper doesn't support FormData uploads
      const uploadResponse = await axios.put("/api/uploadModels", formData, {
        headers: {
          'Content-Disposition': `form-data; name="file"; filename="${file.name}"`,
          'Content-Type': 'application/x-gzip',
          'X-CSRF-Token': csrfToken
        }
      });

      this.removeFlashMessage(loadingMessageId);

      if (uploadResponse.data.success) {
        this.addFlashMessage("Model uploaded successfully", "success");
        this.getModels();
      } else {
        this.addFlashMessage(uploadResponse.data.message ?? "Upload failed", "error");
      }
    } catch (error: any) {
      console.error('Error:', error);
      this.addFlashMessage(error.message ?? "Upload failed", "error");
    }
  };

  handleSelectionChange = ({ detail }: { detail: { selectedItems: Model[] } }) => {
    this.setState({ selectedModels: detail.selectedItems });
  };

  formatDate = (epochTime: number) => {
    const date = new Date(epochTime * 1000); // Convert epoch time to milliseconds
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: '2-digit' };
    const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
    const formattedDate = date.toLocaleDateString('en-US', options);
    const formattedTime = date.toLocaleTimeString('en-US', timeOptions);
    return `${formattedDate} ${formattedTime}`;
  };

  addFlashMessage = (content: string, type: FlashbarProps.Type) => {
    const id = Date.now().toString(); // Use epoch time as unique id
    const newMessage: FlashbarProps.MessageDefinition = {
      id,
      content,
      type,
      dismissible: type !== "in-progress",
      onDismiss: type !== "in-progress" ? () => this.removeFlashMessage(id) : undefined
    };
    this.setState((prevState) => ({
      flashMessages: [...prevState.flashMessages, newMessage]
    }));
    return id; // Return the id of the new message
  };

  removeFlashMessage = (id: string) => {
    this.setState((prevState) => ({
      flashMessages: prevState.flashMessages.filter(message => message.id !== id)
    }));
  };

  renderFlashMessages() {
    return (
      <Flashbar
        items={this.state.flashMessages}
      />
    );
  }

  renderDeleteModal() {
    return (
      <Modal
        onDismiss={() => this.setState({ isDeleteModalVisible: false })}
        visible={this.state.isDeleteModalVisible}
        closeAriaLabel="Close modal"
        header="Delete Model"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => this.setState({ isDeleteModalVisible: false })}>Cancel</Button>
              <Button variant="primary" onClick={this.deleteModels}>Delete</Button>
            </SpaceBetween>
          </Box>
        }
      >
        <TextContent>
          <p>Are you sure you want to delete? You can't undo deleting.</p>
        </TextContent>
      </Modal>
    );
  }

  render() {
    const { models, selectedModels } = this.state;

    return (
      <BaseAppLayout
        content={
          <TextContent>
            {this.renderFlashMessages()}
            {this.renderDeleteModal()}
            <h1>Models</h1>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Reinforcement learning models</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                    type="file"
                    style={{ display: 'none' }}
                    ref={(input) => (this.fileInput = input)}
                    onChange={this.handleFileUpload}
                  />
                <Button onClick={() => this.fileInput?.click()}>Upload Model</Button>
                <Button onClick={() => this.setState({ isDeleteModalVisible: true })} disabled={selectedModels.length === 0}>Delete</Button>
                <Button onClick={this.getModels}>Refresh</Button>
              </div>
            </div>
            <div style={{ marginTop: '16px' }}>
              <Table
                columnDefinitions={[
                  { id: 'name', header: 'Name', cell: item => item.name },
                  { id: 'sensors', header: 'Sensor(s)', cell: item => item.sensors },
                  { id: 'training_algorithm', header: 'Training algorithm', cell: item => item.training_algorithm },
                  { id: 'action_space_type', header: 'Action space type', cell: item => item.action_space_type },
                  { id: 'size', header: 'Size', cell: item => item.size },
                  { id: 'creation_time', header: 'Upload time', cell: item => this.formatDate(item.creation_time) },
                ]}
                items={models}
                header={<Header>Model List</Header>}
                selectionType="multi"
                selectedItems={selectedModels}
                onSelectionChange={this.handleSelectionChange}
              />
            </div>
          </TextContent>
        }
      />
    );
  }
}

export default Models;