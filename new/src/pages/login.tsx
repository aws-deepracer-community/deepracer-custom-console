import { Button, Container } from "@cloudscape-design/components";
import * as React from "react";
import Checkbox from "@cloudscape-design/components/checkbox";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Input from "@cloudscape-design/components/input";


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
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (token) {
          setCsrfToken(token);
          axios.defaults.headers.common['X-CSRF-Token'] = token;
          axios.defaults.withCredentials = true;
          console.log('CSRF token set:', token); // for troubleshooting
        }
      } catch (error) {
        console.error('Error setting CSRF token:', error);
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
      const formData = new FormData();
      formData.append('password', value);
      console.log('CSRF Token:', csrfToken);
      const response = await axios.post('/login', 
        formData,
        {
          headers: {
            'X-CSRF-Token': csrfToken,
          },
          withCredentials: true  // This is crucial for cookie handling
        }
      );
  
      if (response.data === "failure") {
        console.log('Login failed - invalid credentials');
        window.location.reload();
      } else {
        console.log('Login successful');
        // The cookies will be automatically stored by the browser
        // You can verify the cookies are set using:
        console.log('Cookies set:', document.cookie);
        navigate('/home');
      }
    } catch (error) {
      console.error('Login error:', error);
      navigate('/login');
    }
  };
  
  

  return (
      <div style={{ maxWidth: '600px', margin: '0 auto', marginTop: '30px' }}>
        <Container>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}>
          <img src="./static/AWS_logo_RGB.svg" width="100" alt="AWS Logo" style={{ marginTop: '10px' }}></img>
          <h2 style={{ marginTop: '20px' }}>Unlock your AWS DeepRacer vehicle</h2>
          <p>The default AWS DeepRacer password can be found printed on the bottom of your vehicle.  If you've recently flashed your car the password may have been reset to 'deepracer'</p>
          <p style={{ marginTop: '0px' }}><strong>Password</strong></p>
          <div style={{ width: '100%' }}>
            <Input
              onChange={({ detail }) => setValue(detail.value)}
              value={value}
              type= {checked ? "text" : "password"}
              placeholder="Enter your password"
              onKeyDown={({ detail }) => {
                if (detail.keyCode === 13) { // 13 is the key code for Enter
                  submitLogin();
                }
              }}
            />
          </div>
          <div style={{ marginTop: '10px',  width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Checkbox
              onChange={({ detail }) => setChecked(detail.checked)}
              checked={checked}
            >
              Show Password
            </Checkbox>
            <div style={{ marginTop: '10px', width: '100%', display: 'flex' }}>
                <Button variant="primary" onClick={submitLogin} fullWidth={true}>Access vehicle</Button>
            </div>
          </div>
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
        </Container>
      </div>
  );
}
