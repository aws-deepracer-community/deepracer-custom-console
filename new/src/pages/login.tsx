import { TextContent, Textarea } from "@cloudscape-design/components";
import * as React from "react";
import Checkbox from "@cloudscape-design/components/checkbox";

export default () => {
  const [value, setValue] = React.useState("");
  const [checked, setChecked] = React.useState(false);

  return (
    <TextContent>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        width: '100%'
      }}>
        <h1>Login Page</h1>
        <h2>Unlock your AWS DeepRacer vehicle</h2>
        <p>The default AWS DeepRacer password can be found printed on the bottom of your vehicle.</p>
        <p>If you've recently flashed your car the password may have been reset to deepracer</p>
        <p><strong>Password</strong></p>
        <Textarea
          onChange={({ detail }) => setValue(detail.value)}
          value={value}
          disableBrowserAutocorrect
          disableBrowserSpellcheck
          placeholder="Enter your password"
          rows={0}
        />
        <Checkbox
          onChange={({ detail }) =>
            setChecked(detail.checked)
          }
          checked={checked}
        >
          Show Password
        </Checkbox>
        <p>
          <a 
            href="https://docs.aws.amazon.com/console/deepracer/recover-vehicle-password"
            target="_blank"
            rel="noopener noreferrer"
          >
            Forgot password?
          </a>
        </p>
      </div>
    </TextContent>
  );
}
