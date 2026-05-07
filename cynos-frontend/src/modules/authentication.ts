import { signUp } from "aws-amplify/auth"
import { signIn } from "aws-amplify/auth"
import { confirmSignUp } from 'aws-amplify/auth'

import { userNotification } from "./notifications.ts";

/* ********************************************************** */
export async function loginWindow() {
    var h = `
    <h1>Login</h1>
    <form id="loginform">
      <table style="margin-left: auto; margin-right: auto;">
        <tr>
          <td>
            <label htmlFor="email">Email:</label>
          </td>
          <td>
            <input type="text" id="email" name="email" /><br>
          </td>
        </tr>
        <tr>
          <td>
            <label htmlFor="password">Password:</label>
          </td>
          <td>
            <input type="password" id="password" name="password" /><br>
          </td>
        </tr>
        <tr>
          <td colspan="2">
          </td>
        </tr>
      </table>
    <input type="submit" value="Login" />
    </form>
    <a href="/register" style="font-size: smaller">Don't have an account? Register here</a>`
    document.querySelector<HTMLDivElement>('#app')!.innerHTML = h;

    var form = document.getElementById('loginform') as HTMLFormElement;
    form.addEventListener('submit', async function (event) {
	    event.preventDefault();
        var el = document.getElementById('email')as HTMLInputElement;
    	var email = el.value;
        el = document.getElementById('password') as HTMLInputElement;
	    var password = el.value;
	    const { nextStep } = await signIn({
		    username: email,
		    password: password,
		    options: {
			    authFlowType: 'USER_PASSWORD_AUTH',
			    preferredChallenge: 'PASSWORD'
		    }
	    });
	    if (nextStep.signInStep === 'DONE') {
		    console.log("Signin successful");
		    window.location.replace("/");
	    } else {
		    console.log("Login failed: "+nextStep.signInStep);
		    userNotification("ERROR", "Login failed");
	    }
    });
}

/* ********************************************************** */
async function register(event: Event) {
	event.preventDefault();
    var el = document.getElementById('email') as HTMLInputElement;
	var email = el.value;
    el = document.getElementById('password') as HTMLInputElement;
	var password = el.value;
	//console.log(email, password);

	//const { isSignUpComplete, userId, nextStep } = await signUp({
	const { nextStep: signUpNextStep } = await signUp({
		username: email,
		password: password,
		options: {
			userAttributes: {
      			email: email
    		},
  		}
	});
	if (signUpNextStep.signUpStep == "DONE") {
		// Registering requires entering a code sent via email.
		// The registration process cannot be done.
		alert("Registering in state DONE. Should require verification code");
		return;
	} else if (signUpNextStep.signUpStep == "COMPLETE_AUTO_SIGN_IN") {
		alert("Well this is awkward. Auto sign in was returned. I can't do that");
	} else if (signUpNextStep.signUpStep == "CONFIRM_SIGN_UP") {
		// this should be default.
		// A code has been sent via email. Show verification pane.
	}

	var h = `
	<h1>Verify email</h1>
	An email with a confirmation code has been sent to ` + email +`. Please
	enter the code below.<br>
	<form id="verifyForm">
  	  <input type="text" id="verifycode" />
	  <input type="submit" />
	</form>`
    document.querySelector<HTMLDivElement>('#app')!.innerHTML = h;

    var form = document.getElementById("verifyForm") as HTMLFormElement;
	form.addEventListener('submit', function (event) {
		var el = document.getElementById('verifycode') as HTMLInputElement;
        var code = el.value;
		verifyUser(event, email, code)
	});
}

/* ********************************************************** */
export function registerWindow() {
    var h = `
	<h1>Register for Cynos</h1>
	<form id="registerForm">
	  <label htmlFor="email">Email:</label>
	  <input type="text" id="email" name="email" /><br>
	  <label htmlFor="password">Password:</label>
	  <input type="password" id="password" name="password" /><br>
	  <input type="submit" />
	</form>`
    document.querySelector<HTMLDivElement>('#app')!.innerHTML = h;

    var form = document.getElementById("registerForm") as HTMLFormElement;
    form.addEventListener('submit', register);
}

/* ********************************************************** */
async function verifyUser(event: Event, email: string, code: string) {
	event.preventDefault();

	console.log(email);
	console.log(code);

	const { nextStep: confirmSignUpNextStep } = await confirmSignUp({
  		username: email,
		confirmationCode: code
	});

	if( confirmSignUpNextStep.signUpStep === "DONE" ) {
		console.log("SignUp complete");
		window.location.replace("/");
	} else {
		console.log("Signup confirmation failed");
		userNotification("ERROR", "Signup confirmation failed");
	}


	var h = "<h1>Confirmation failed</h1>";
    	document.querySelector<HTMLDivElement>('#app')!.innerHTML = h;
}

/* ********************************************************** */
export function verifyWindow() {
	var h = `
	<h1>Verify email</h1>
	<form id="verifyForm">
	  <label htmlFor="email">Email:</label>
  	  <input type="text" id="email" />
	  <label>Code:</label>
  	  <input type="text" id="verifycode" />
	  <input type="submit" />
	</form>`
    document.querySelector<HTMLDivElement>('#app')!.innerHTML = h;

    var form = document.getElementById("verifyForm") as HTMLFormElement;
    form.addEventListener('submit', function (event) {
        var el = document.getElementById('verifycode') as HTMLInputElement;
        var code = el.value;
        el = document.getElementById('email') as HTMLInputElement;
        var email = el.value;
        verifyUser(event, email, code) 
    });

}