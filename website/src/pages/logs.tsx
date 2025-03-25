import React from "react";
import { TextContent } from "@cloudscape-design/components";
import BaseAppLayout from "../components/base-app-layout";
import Button from "@cloudscape-design/components/button";
import { ApiHelper } from '../common/helpers/api-helper';

interface LogsPageProps {}

interface LogsPageState {
  sysLogs: string;
  sysLogCopied: boolean;
}

interface LogsResponse {
  data: string;
}

class LogsPage extends React.Component<LogsPageProps, LogsPageState> {
  private sysInputRef: React.RefObject<HTMLPreElement>;

  constructor(props: LogsPageProps) {
    super(props);
    this.state = {
      sysLogs: "",
      sysLogCopied: false,
    };
    this.sysInputRef = React.createRef();
  }

  componentDidMount() {
    this.getSysLogs();
  }

  getSysLogs = async () => {
    const response = await ApiHelper.get<LogsResponse>('logs/SYS/200');
    if (response) {
      this.setState({ sysLogs: response.data });
    }
  };

  sysLogCopyBtnClicked = () => {
    const textArea = document.createElement("textarea");
    textArea.value = this.state.sysLogs;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    this.setState({ sysLogCopied: true });
    setTimeout(() => this.setState({ sysLogCopied: false }), 2000);
  };

  render() {
    return (
      <BaseAppLayout
        content={
          <TextContent>
            <h1>Logs</h1>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>System event log</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button onClick={this.sysLogCopyBtnClicked}>Copy</Button>
                <Button onClick={this.getSysLogs}>Refresh</Button>
                {this.state.sysLogCopied}
              </div>
            </div>
            <pre ref={this.sysInputRef}>{this.state.sysLogs}</pre>
          </TextContent>
        }
      />
    );
  }
}

export default LogsPage;