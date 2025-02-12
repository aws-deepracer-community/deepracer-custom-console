import { TextContent, Textarea, Button } from "@cloudscape-design/components";
import * as React from "react";
import Checkbox from "@cloudscape-design/components/checkbox";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const handleLogout = async () => {
  try {
    const response = await axios.get('/redirect_login');
    console.log('Vehicle Logged Out:', response.data);
  } catch (error) {
    console.error('Error logging out vehicle:', error);
  }
};


export default () => {
  const [value, setValue] = React.useState("");
  const [checked, setChecked] = React.useState(false);
  const [csrfToken, setCsrfToken] = React.useState("");
  const navigate = useNavigate();
  
  handleLogout();

  // Generate and set up CSRF token on component mount
  React.useEffect(() => {
    const generateCsrfToken = async () => {
      try {
        // Make a request to your backend endpoint that generates a CSRF token
        const response = await axios.get('/generate-csrf');
        const token = response.data.csrf_token;
        
        // Set the token in state
        setCsrfToken(token);
        
        // Set up axios defaults
        axios.defaults.headers.common['X-CSRFToken'] = token;
        axios.defaults.withCredentials = true;

        // Add the token to the document head as a meta tag
        const meta = document.createElement('meta');
        meta.name = 'csrf-token';
        meta.content = token;
        document.head.appendChild(meta);

        console.log('CSRF token generated:', token); //for troubleshooting
      } catch (error) {
        console.error('Error generating CSRF token:', error);
      }
    };

    generateCsrfToken();
  }, []);

  // Modified submitLogin to explicitly include the CSRF token
  const submitLogin = async () => {
    console.log('Attempting login...');
    
    if (!value) {
      console.error('Password cannot be empty');
      return;
    }
  
    try {
      // Create FormData object
      const formData = new FormData();
      formData.append('password', value);
  
      const response = await axios.post('/login', 
        formData,  // Send as FormData
        {
          headers: {
            'X-CSRFToken': csrfToken,
            // Don't set Content-Type - axios will set it automatically with boundary for FormData
          },
          withCredentials: true
        }
      );
  
      if (response.data === "failure") {
        console.log('Login failed - invalid credentials');
        window.location.reload();
      } else {
        console.log('Login successful');
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
        width: '100%',
      }}>
        <img src="./static/AWS_logo_RGB.svg" width="100" alt="AWS Logo" style={{ marginTop: '8px' }}></img>
        <h2>Unlock your AWS DeepRacer vehicle</h2>
        <p>The default AWS DeepRacer password can be found printed on the bottom of your vehicle.</p>
        <p>If you've recently flashed your car the password may have been reset to deepracer</p>
        <p><strong>Password</strong></p>
        <Textarea
            onChange={({ detail }) => {
              // Remove any newline characters from the input
              const cleanValue = detail.value.replace(/\n/g, '');
              setValue(cleanValue);
            }}
          value={value}
          disableBrowserAutocorrect
          autoFocus={true}
          spellcheck
          placeholder="Enter your password"
          rows={1}
          onKeyDown={({ detail }) => {
            if (detail.keyCode === 13) { // 13 is the key code for Enter
              submitLogin();
            }
          }}
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
