import React from "react";
import { Card, Button, Form } from "react-bootstrap";
import { useHistory } from "react-router-dom";

import GeneratorButton from "../../utils/GeneratorButton"
import { useAuth } from "../../utils/use-auth";
import SignUpForm from "./Components/SignUpForm";

import "./SignInStyle.css";

const SignIn = (props) => {
  let [forgotPassword, setForgotPassword] = React.useState(false);
  let [receivedEmailCode, setReceivedEmailCode] = React.useState(false);
  let [signup, setSignup] = React.useState(false);

  let [username, setUsername] = React.useState("");
  let [password, setPassword] = React.useState("");
  let [newPassword, setNewPassword] = React.useState("");

  let [tempEmail, setTempEmail] = React.useState("");
  let [tempCode, setTempCode] = React.useState("");

  const history = useHistory();

  const auth = useAuth();

  const [invalidLoginCreds, setInvalidLoginCreds] = React.useState(false);

  const tryLogin = (event) => {
    event.preventDefault();
    event.stopPropagation();

    // Don't bother checking if either field is empty
    if(username !== "" && password !== ""){
      auth.login(username, password).then(res => {
        if(res.error){;
          setInvalidLoginCreds(true);
        } else {
          if (res.active){
            history.push("/HottestMixtapes");
          }
          else {
            history.push("/ReactivateAccount");
          }
        }
      });
    } else {
      setInvalidLoginCreds(true);
    }
  }

  const completeSignup = () => {
    setSignup(false);
  }

  

  // const sendPassEmail = (msg) => {
  //   sgMail
  //   .send(msg)
  //   .then(() => {
  //     console.log('Email sent')
  //   })
  //   .catch((error) => {
  //     console.error(error)
  //   });
  // }

  return (
    <div className="splash-container">
      <GeneratorButton/>
      <Card className="text-center signin-card secondary-color-transparent">
        {!forgotPassword && !signup && <><h1>Mix n' Mash</h1><h2>Log In</h2></>}
        {forgotPassword && <h2>Forgot Password</h2>}
        {signup && <h2>Sign Up</h2>}

        {/* ---------- LOGIN FORM ---------- */}
        {!forgotPassword && !signup && <Card.Body>
          <Form className="space-above" onSubmit={tryLogin}>
            <Form.Group controlId="formBasicEmail">
              <Form.Label>Username or Email address</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter username or email"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                isInvalid={invalidLoginCreds}
              />
              <Form.Control.Feedback type="invalid">Invalid username or password</Form.Control.Feedback>
            </Form.Group>

            <Form.Group controlId="formBasicPassword">
              <Form.Label>Password{" "}<div className="mm-link-dark" onClick={() => setForgotPassword(true)}>Forgot Password</div></Form.Label>
              <Form.Control type="password" placeholder="Password" onChange={(event) => setPassword(event.target.value)} />
            </Form.Group>
            <Button type="submit" variant="primary" className="mm-btn-alt">
              Get Mashing!
            </Button>{" "}
            <Button variant="primary" className="mm-btn-alt" onClick={() => setSignup(true)}>
              No Account? Sign Up!
            </Button>

          </Form>
        </Card.Body>}

        {forgotPassword && !receivedEmailCode && <Card.Body>
          <div>Please enter your email:</div>
          <Form.Group>
            <Form.Control type="email" placeholder="Enter the email for your account..." onChange={(event)=> setTempEmail(event.target.value)}/>
          </Form.Group>
          <Button className="mm-btn-alt" onClick={() => {auth.forgotPassword(tempEmail); setReceivedEmailCode(true);}}>Send Email</Button>
          <br/>
          <Button variant="primary" className="mm-btn-alt" onClick={() => {setForgotPassword(false); setReceivedEmailCode(false); setTempEmail(""); setTempCode(""); setNewPassword("");}}>
            Back to Log-In
          </Button>
        </Card.Body>}

        {forgotPassword && receivedEmailCode && <Card.Body>
          <div>Please enter the temporary code sent to your email:</div>
          <Form.Group>
            <Form.Control type="text" placeholder="Enter the temporary code sent to your email..." onChange={(event)=> setTempCode(event.target.value)}/>
          </Form.Group>
          <div>Enter your new desired password:</div>
          <Form.Group>
            <Form.Control type="text" placeholder="Enter your new desired password..." onChange={(event)=> setNewPassword(event.target.value)}/>
          </Form.Group>
          <Button className="mm-btn-alt" onClick={() => {auth.resetPassword(tempEmail, tempCode, newPassword).then((res)=>{
            if (res.error){

            }
            else{
              setForgotPassword(false);
              setReceivedEmailCode(false); 
              setTempEmail(""); 
              setTempCode(""); 
              setNewPassword("");
            }
          });}}>Update Password</Button>
          <br/>
          <Button variant="primary" className="mm-btn-alt" onClick={() => {setForgotPassword(false); setReceivedEmailCode(false); setTempEmail(""); setTempCode(""); setNewPassword("");}}>
            Back to Log-In
          </Button>
        </Card.Body>}

        {signup &&
          <Card.Body>
            <SignUpForm cancelSignUp={() => setSignup(false)} successfulSignup={completeSignup}/>
          </Card.Body>}
      </Card>
    </div>
  );
}

export default SignIn;
