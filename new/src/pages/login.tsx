import { TextContent, Textarea, Button } from "@cloudscape-design/components";
import * as React from "react";
import Checkbox from "@cloudscape-design/components/checkbox";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default () => {
  const [value, setValue] = React.useState("");
  const [checked, setChecked] = React.useState(false);
  const navigate = useNavigate();

  // Set up axios defaults for CSRF
  React.useEffect(() => {
    // Get CSRF token from meta tag
    const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    
    // Set up axios defaults to include CSRF token in headers
    if (token) {
      axios.defaults.headers.common['X-CSRFToken'] = token;
    }

    // Set up axios to include credentials in requests
    axios.defaults.withCredentials = true;
    console.log('csrf token:', token); //for troubleshooting
  }, []);

  const submitLogin = async () => {
    //console.log('Logging in with password:', value);  //for troubleshooting
    try {
      const response = await axios.post('/login', {
        password: value
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.data === "failure") {
        navigate('/login');
      } else {
        navigate('/home');
      }
    } catch (error) {
      console.error('Login error:', error);
      navigate('/login');
    }
  };
  

  return (
    <TextContent>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        width: '100%'
      }}>
        <img src="./static/AWS_logo_RGB.svg" width="100" alt="AWS Logo"></img>
        <h2>Unlock your AWS DeepRacer vehicle</h2>
        <p>The default AWS DeepRacer password can be found printed on the bottom of your vehicle.</p>
        <p>If you've recently flashed your car the password may have been reset to deepracer</p>
        <p><strong>Password</strong></p>
        <Textarea
          onChange={({ detail }) => setValue(detail.value)}
          value={value}
          disableBrowserAutocorrect
          autoFocus={true}
          spellcheck
          placeholder="Enter your password"
          rows={1}
        />
        <Checkbox
          onChange={({ detail }) => setChecked(detail.checked)}
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
        <Button variant="primary" onClick={submitLogin}>Access vehicle</Button>
      </div>
    </TextContent>
  );
}
