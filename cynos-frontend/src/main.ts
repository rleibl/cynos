import { generateClient } from "aws-amplify/data";
import type { Schema } from "../amplify/data/resources";
import './style.css'
import { Amplify } from "aws-amplify";

import { signUp } from "aws-amplify/auth"
import { signIn } from "aws-amplify/auth"
import { confirmSignUp } from 'aws-amplify/auth'
import { getCurrentUser } from 'aws-amplify/auth'
import { fetchUserAttributes } from 'aws-amplify/auth'

import outputs from '../amplify_outputs.json';

Amplify.configure(outputs);

// Use this to not always query the dynamodb
// for SMB shares.
const EXAMPLE_SMB_SHARE_DATA = [{
     "ip": "10.12.212.22",
     "hostname": "myfiles.grp.haufemg.com",
     "last_seen": "01-01-2024",
     "comment": "",
     "known_host": false,
     "cyber_comment": "",
     "shares": [
	{
	  "share": "CIFS$",
	  "user": "SSRV_InfoSecShareScn",
	  "privileges":"READ_ONLY"
	}
     ]
     },{
     "ip": "10.12.212.23",
     "hostname": "myfiles.grp.haufemg.com",
     "last_seen": "01-01-2024",
     "comment": "",
     "known_host": false,
     "cyber_comment": "",
     "shares": [
	{
	  "share": "CIFS$",
	  "user": "SSRV_InfoSecShareScn",
	  "privileges":"READ_ONLY"
	},
	{
	  "share": "PUBLIC",
	  "user": "SSRV_InfoSecShareScn",
	  "privileges":"READ_WRITE"
	},
	{
	  "share": "C$",
	  "user": "SSRV_InfoSecShareScn",
	  "privileges":"READ_WRITE"
	}
     ]
     },{
     "ip": "10.12.212.24",
     "hostname": "myfiles.grp.haufemg.com",
     "last_seen": "01-01-2024",
     "comment": "",
     "known_host": false,
     "cyber_comment": "",
     "shares": [
	{
	  "share": "CIFS$",
	  "user": "SSRV_InfoSecShareScn",
	  "privileges":"READ_ONLY"
	}
     ]
 }];


/* ********************************************************** */
function userNotification(status, msg) {

	var s = document.createElement('span');
	if( status == "ERROR" ) {
		s.style.color = "red";
	} else if( status === "OK" ) {
		s.style.color = "green";
	} // else white

	s.textContent = msg;

	const parent = document.getElementById('notifications');
	parent.replaceChildren(s);
}

/* ********************************************************** */
async function checkUser() {
  try {
    const { username, userId, signInDetails } = await getCurrentUser();
    console.log(`Current user: ${username}`);
    console.log(`  userId: ${userId}`);
    console.log(`  SignInDetails: ${signInDetails}`);
    return [true, username];
  } catch (err) {
    console.log(err);
    console.log("User is not signed in");
    return [false, ""];
  }
}

/* ********************************************************** */
async function loginWindow() {
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

    var form = document.getElementById('loginform');
    form.addEventListener('submit', async function (event) {
	    event.preventDefault()
    	    email = document.getElementById('email').value;
	    password = document.getElementById('password').value;
	    const { nextStep } = await signIn({
		    username: email,
		    password: password,
		    options: {
			    authFlowType: 'USER_PASSWORD_AUTH',
			    preferredChallenge: 'PASSWORT'
		    }
	    });
	    if (nextStep.signInStep === 'DONE') {
		    console.log("Signin successful");
		    window.location.replace("/");
	    } else {
		    console.log("Login failed: "+nextStep.signInStep);
		    userNotification("Login failed");
	    }
    });
}

/* ********************************************************** */
async function register(event) {
	event.preventDefault()
	var email = document.getElementById('email').value;
	var password = document.getElementById('password').value;
	//console.log(email, password);

	const { isSignUpComplete, userId, nextStep } = await signUp({
		username: email,
		password: password,
		options: {
			userAttributes: {
      				email: email
    			},
  		}
	});
	if (nextStep == "DONE") {
		// Registering requires entering a code sent via email.
		// The registration process cannot be done.
		alert("Registering in state DONE. Should require verification code");
		return;
	} else if (nextStep == "COMPLETE_AUTO_SIGN_IN") {
		alert("Well this is awkward. Auto sign in was returned. I can't do that");
	} else if (nextStep == "CONFIRM_SIGN_UP") {
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

    	var form = document.getElementById("verifyForm");
	form.addEventListener('submit', function (event) {
		var code = document.getElementById('verifycode').value;
		verifyUser(event, email, code)
	});
}

/* ********************************************************** */
function registerWindow() {
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

    var form = document.getElementById("registerForm");
    form.addEventListener('submit', register);
}

/* ********************************************************** */
async function verifyUser(event, email, code) {
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
function verifyWindow() {
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

    	var form = document.getElementById("verifyForm");
	form.addEventListener('submit', function (event) {
		var code = document.getElementById('verifycode').value;
		var email = document.getElementById('email').value;
		verifyUser(event, email, code) 
	});

}


/* ********************************************************** */
/*
 {
     "ip": "10.12.212.22",
     "hostname": "myfiles.grp.haufemg.com",
     "last_seen": "01-01-2024",
     "comment": "",
     "known_host": false,
     "cyber_comment": "",
     "shares": [
	{
          "share": "CIFS$",
	  "user": "SSRV_InfoSecShareScn",
	  "privileges":"READ_ONLY"
        }
     ]
 }
*/
async function smbWindow() {
	const container = document.getElementById('app');

	// Summary
	const h2 = document.createElement('h2');
	h2.innerText = "Summary";

	// Main table and header
	const table = document.createElement('table');
	table.id = "smbtable";
	table.className = "smbtable";
	const thead = table.createTHead();
	const headerRow = thead.insertRow();
	
	// Define the columns we want to show
	const columns = [
		"IP Address",
		"Hostname",
		"Last Seen",
		"Comment",
		"Known",
		"Notes",
		"#Shares"
	];
	
	columns.forEach(text => {
	    const th = document.createElement('th');
	    th.className = "smbsummaryheader";
	    th.textContent = text;
	    headerRow.appendChild(th);
	});
	
	// table body
	const tbody = document.createElement('tbody');
	table.appendChild(tbody);

	// Retrieve Data
	const client = generateClient<Schema>();

	// demo data
	//var errors = undefined;
	//var data = EXAMPLE_SMB_SHARE_DATA;

	const { data, errors } = await client.queries.getSMBHosts();
	console.log("data: ", data)
	console.log("errors: ", errors);
	
	// Rows
	data.forEach(device => {
	    const row = tbody.insertRow();
	    row.className = "smbsummaryrow";
	    row.addEventListener("click", toggleSmbDetail);
	
	    row.insertCell().textContent = device.ip;
	    row.insertCell().textContent = device.hostname;
	    row.insertCell().textContent = device.last_seen;
	    row.insertCell().textContent = device.comment;
	    row.insertCell().textContent = device.known_host ? "Yes" : "No";
	    row.insertCell().textContent = device.cyber_comment;
	    row.insertCell().textContent = device.shares.length;
	
	    // Using the color logic we discussed:
	    /*
	    const dateCell = row.insertCell();
	    dateCell.textContent = device.last_seen;
	    if (device.last_seen === "01-01-1970") {
	        dateCell.style.color = "red";
	        dateCell.style.fontWeight = "bold";
	    }
	    */
	    const d_row = tbody.insertRow();
	    d_row.className = "smbdetailsrow";
	    const details = d_row.insertCell();
	    details.className = "smbdetailscol";
	    details.colSpan = columns.length;
	    renderSmbDetails(details, device);
	});
	
	// 4. Inject the finished table into the DOM
	container.replaceChildren(h2, table);
}

function renderSmbDetails(target, device) {

	const t = document.createElement('table');
	t.className = "smbdetails";
	const thead = t.createTHead();
	const headerRow = thead.insertRow();

	const headers = ["Share", "User", "Permissions"];

	headers.forEach(text => {
		const th = document.createElement("th");
		th.textContent = text;
		headerRow.appendChild(th);
	});

	const tbody = document.createElement('tbody');
	t.appendChild(tbody);

	device.shares.forEach(share => {
		const row = tbody.insertRow();

		row.insertCell().textContent = share.share;
		row.insertCell().textContent = share.user;
		row.insertCell().textContent = share.privileges;
	});

	target.appendChild(t);
}

function toggleSmbDetail(event) {

	const row = event.target.closest('tr.smbsummaryrow');
	if(!row) {
		console.log("Could not find tr.smbsummaryrow");
		return;
	}

	const detailsRow = row.nextElementSibling;
	if(!detailsRow) {
		console.log("Could not find detailsRow");
		return;
	}

	if(detailsRow.style.display === "none" || 
	   detailsRow.style.display === "" ) {
		detailsRow.style.display = "table-row";
	} else {
		detailsRow.style.display = "none";
	}
}

/* ********************************************************** */
async function mainWindow(username) {

	/* ****************** Page setup ******************** */

	// Get parent
	const parent = document.getElementById('app');

	const h1 = document.createElement('h1');
	h1.textContent = 'Summary';

	var username = "unknown";
	try {
    		const attributes = await fetchUserAttributes();
		console.log("User attributes: ", attributes);
		username = attributes['email'];
  	} catch (err) {
    		console.log(err);
	}
	const greeting = document.createTextNode('user');
	greeting.textContent = "Hello " + username;

	const h2 = document.createElement('h2');
	h2.textContent = 'Last check for RSS updates';

	const span = document.createElement('span');
	span.id = 'rsslastcheck';
	span.textContent = 'never';

	// Swap the old content for the new elements
	parent.replaceChildren(h1, greeting, h2, span);

	/* ****************** Page setup done *************** */

	const client = generateClient<Schema>();

	const rss_check_field = document.getElementById("rsslastcheck");

	const { data, errors } = await client.queries.getRss();
	console.log("data: ", data)
	console.log("errors: ", errors);

	const unixTimestamp = data['t'];
	const date = new Date(unixTimestamp * 1000);
	rss_check_field.innerHTML = date.toLocaleString();

	userNotification("OK", "test notification");
	//userNotification("ERROR", "test error");
}

function mk_link_navigation(path, text, highlight_path) {
	const l = document.createElement('a');
	l.href = path;
	l.textContent = text
	l.rel = "noopener noreferrer";
	if( path == highlight_path ) {
		l.style.color = "white";
		l.style.fontWeight = "bold";
	}

	return l;
}
/* ********************************************************** */
async function navigation(path) {

	var parent = document.getElementById('navigation');

	const lhome = mk_link_navigation('/', "home", path);
	const lalerts = mk_link_navigation('/alerts', "Alerts", path);
	const lsmb = mk_link_navigation('/smb', "SMB", path);

	var content = [
		lhome,
		" | ",
		lalerts,
		" | ",
		lsmb
	];
	parent.replaceChildren(...content);
}
/* ********************************************************** */
async function routeAuthenticated(path: string) {

	var [loggedin, username] = await checkUser();
	if (!loggedin) {
		loginWindow();
		return;
	}

	navigation(path);

	switch (path) {
		case "/":
			mainWindow(username);
			break;
		case "/smb":
			smbWindow();
			break;
		default:
			console.log("Unknown path: " + path);
			mainWindow(username);
			
	}
}

/* **********************************************************
 * Routing
 * **********************************************************/
var u = new URL(window.location.href);

const path = u.pathname;
switch (path) {
	case '/login':
		console.log("Routing: /login");
		loginWindow();
		break;
	case '/register':
		console.log("Routing: /register");
		registerWindow();
		break;
	case '/verify':
		console.log("Routing: /verify");
		verifyWindow();
		break;
	default:
		console.log("Routing (Authenticated): " + path);
		routeAuthenticated(path);
}

