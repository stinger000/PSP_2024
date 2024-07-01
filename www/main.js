/*
 * Copyright (C) 2020 Copter Express Technologies
 *
 * Author: Oleg Kalachev <okalachev@gmail.com>
 *
 * Distributed under MIT License (available at https://opensource.org/licenses/MIT).
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 */

import * as ros from './ros.js';
import './blocks.js';
import {generateCode, generateUserCode} from './python.js';
import './auth.js'

// const ws = Blockly.inject(blocklyDiv, {
// 	renderer: 'zelos',
// 	toolbox,
//   });

var logged = false;
var gUsername = null;
var gToken = null;

document.addEventListener('DOMContentLoaded', loadCheckToken);

// Tabs
document.getElementById('tabs').addEventListener('click', function(e) {
	var tab = e.target.getAttribute('data-tab');
	if (tab) {
		for (let elem of e.target.parentElement.querySelectorAll('[data-tab]')) {
			elem.classList.remove('selected');
		}
		e.target.classList.add('selected');
		document.body.setAttribute('data-tab', tab);
	}
});

var workspace = Blockly.inject('blockly', {
	toolbox: document.getElementById('toolbox'),
	grid: {
		spacing: 25,
		length: 3,
		colour: '#ccc',
		snap: true
	},
	zoom: { controls: true, wheel: true },
	media: 'blockly/media/',
	renderer: 'zelos',
});

function readParams() {
	return Promise.all([
	]);
}

var ready = readParams(); // initialization complete promise

var pythonArea = document.getElementById('python');

// update Python code
workspace.addChangeListener(function(e) {
	ready.then(function() {
		pythonArea.innerHTML = generateUserCode(workspace);
		hljs.highlightBlock(pythonArea);
	});
});

var running = false;
var runRequest = false;

// new ROSLIB.Topic({ ros: ros.ros, name: ros.priv + 'block', messageType: 'std_msgs/String' }).subscribe(function(msg) {
// 	workspace.highlightBlock(msg.data);
// 	runRequest = false;
// 	update();
// });

// new ROSLIB.Topic({ ros: ros.ros, name: ros.priv + 'running' }).subscribe(function(msg) {
// 	running = msg.data;
// 	runRequest = false;
// 	if (!running) {
// 		workspace.highlightBlock('');
// 	}
// 	update();
// });

var notifElem = document.getElementById('notifications');

function z(n) { return (n < 10 ? '0' : '') + n; } // add leading zero

// new ROSLIB.Topic({ ros: ros.ros, name: ros.priv + 'print', messageType: 'std_msgs/String'}).subscribe(function(msg) {
// 	var d = new Date(); // TODO: use rosgraph_msgs/Log?
// 	var timestamp = `${z(d.getHours())}:${z(d.getMinutes())}:${z(d.getSeconds())}`;
// 	notifElem.innerHTML += `${timestamp}: ${msg.data}\n`;
// 	notifElem.scrollTop = notifElem.scrollHeight;
// });

// new ROSLIB.Topic({ ros: ros.ros, name: ros.priv + 'error', messageType: 'std_msgs/String'}).subscribe(function(msg) {
// 	alert('Error: ' + msg.data);
// });

var runButton = document.getElementById('run');

function update() {
	document.body.classList.toggle('running', running);
	// runButton.disabled = !ros.ros.isConnected || runRequest || running;
}

var shownPrompts = new Set();

// new ROSLIB.Topic({ ros: ros.ros, name: ros.priv + 'prompt', messageType: 'clover_blocks/Prompt'}).subscribe(function(msg) {
// 	if (shownPrompts.has(msg.id)) return;
// 	shownPrompts.add(msg.id);

// 	var response = prompt(msg.message);
// 	new ROSLIB.Topic({
// 		ros: ros.ros,
// 		name: ros.priv + 'input/' + msg.id,
// 		messageType: 'std_msgs/String',
// 		latch: true
// 	}).publish(new ROSLIB.Message({ data: response || '' }));
// });

window.stopProgram = function() {
	// ros.stopService.callService(new ROSLIB.ServiceRequest(), function(res) {
	// 	if (!res.success) alert(res.message);
	// }, err => alert(err))
}

// ros.ros.on('connection', update);

// ros.ros.on('close', update);

// ready.then(() => runButton.disabled = false);

window.runProgram = function() {
	console.log("типа запустили");
}

window.land = function() {
	console.log("land");
}

function getProgramXml() {
	var xmlDom = Blockly.Xml.workspaceToDom(workspace);
	return Blockly.Xml.domToPrettyText(xmlDom);
}

function setProgramXml(xml) {
	workspace.clear();
	if (xml) {
		let xmlDom = Blockly.Xml.textToDom(xml);
		Blockly.Xml.domToWorkspace(xmlDom, workspace);
	}
}

workspace.addChangeListener(function(e) {
	localStorage.setItem('xml', getProgramXml());
});

var programSelect = document.querySelector('#program-name');
var userPrograms = programSelect.querySelector('optgroup[data-type=user]');
// var examplePrograms = programSelect.querySelector('optgroup[data-type=example]');

var programs = {};
var program = '';

function loadWorkspace() {
	var xml = localStorage.getItem('xml');
	if (xml) {
		setProgramXml(xml);
	}
	program = localStorage.getItem('program') || '';
}

loadWorkspace();

function loadPrograms() {
	console.log("Start load programs")
	if (!logged){
		return;
	}
	// add request to load programs
	const obj = {};
	obj.username = gUsername;
	obj.token = gToken;

	const request = {
		method: 'POST',
		headers: {
		'Content-Type': 'application/json; charset=UTF-8'
		},
		body: JSON.stringify(obj)
	};
	
	fetch("/load", request)
	.then(response => response.json())
	.then(data => {
	  if (data.result) {

		console.log("Loaded programs")
		console.log(data.progs)
		for (let i = 0; i < data.progs.length; i++) {
			let name = data.progs[i].name;
			let program = data.progs[i].text;
			let option = document.createElement('option');
			option.innerHTML = name;
			userPrograms.appendChild(option);
			programs[name] = program;
		}

		if (program) {
			programSelect.value = program;
		}
		updateChanged();
	  } else {
		console.error('Something went wrong while loading programs');
	  }
	})
	.catch(error => console.error('Error:', error));	

	// ros.loadService.callService(new ROSLIB.ServiceRequest(), function(res) {
	// 	if (!res.success) alert(res.message);

	// 	for (let i = 0; i < res.names.length; i++) {
	// 		let name = res.names[i];
	// 		let program = res.programs[i];
	// 		let option = document.createElement('option');
	// 		option.innerHTML = res.names[i];
	// 		if (name.startsWith('examples/')) {
	// 			examplePrograms.appendChild(option);
	// 		} else {
	// 			userPrograms.appendChild(option);
	// 		}

	// 		programs[name] = program;
	// 	}

	// 	if (program) {
	// 		programSelect.value = program;
	// 	}
	// 	updateChanged();
	// }, function(err) {
	// 	document.querySelector('.backend-fail').style.display = 'inline';
	// 	alert(`Error loading programs list.\n\nHave you enabled 'blocks' in clover.launch?`);
	// 	runButton.disabled = true;
	// })
}

// loadPrograms();

function getProgramName() {
	if (programSelect.value.startsWith('@')) {
		return ''
	}
	return programSelect.value;
}

function updateChanged() {
	var name = program;
	document.body.classList.toggle('changed', name in programs && (programs[name].trim() != getProgramXml().trim()));
}

workspace.addChangeListener(function(e) {
	if (e instanceof Blockly.Events.Change || e instanceof Blockly.Events.Create || e instanceof Blockly.Events.Delete) {
		updateChanged();
	}
});

function saveProgram() {
	if (!logged){
		return;
	}
	var name = getProgramName();

	if (!name) {
		name = prompt('Enter new program name:');
		if (!name) {
			programSelect.value = program;
			return;
		}
		if (!name.endsWith('.xml')) {
			name += '.xml';
		}
		let option = document.createElement('option');
		option.innerHTML = name;
		userPrograms.appendChild(option);
	}

	let xml = getProgramXml();
	console.log(xml)

	const obj = {};
	obj.username = gUsername;
	obj.token = gToken;
	obj.prog_name = name;
	obj.prog_text = xml;

	const request = {
		method: 'POST',
		headers: {
		'Content-Type': 'application/json; charset=UTF-8'
		},
		body: JSON.stringify(obj)
	};
	
	fetch("/save", request)
	.then(response => response.json())
	.then(data => {
	  if (data.result) {

		console.log('Saved on server');
		console.log(data.message);
		programSelect.blur();
		program = name;
		localStorage.setItem('program', name);
		programs[name] = xml;
		programSelect.value = program;
		updateChanged();
	  } else {
		console.error('Something went wrong while saving');
	  }
	})
	.catch(error => console.error('Error:', error));	
	// ros.storeService.callService(new ROSLIB.ServiceRequest({
	// 	name: name,
	// 	program: xml
	// }), function(result) {
	// 	if (!result.success) {
	// 		alert(result.message);
	// 		return;
	// 	}
	// 	console.log(result.message);
	// 	programSelect.blur();
	// 	program = name;
	// 	localStorage.setItem('program', name);
	// 	programs[name] = xml;
	// 	programSelect.value = program;
	// 	updateChanged();
	// }, function(err) {
	// 	// TODO: restore previous state correctly
	// 	alert('Unable to store: ' + err);
	// 	programSelect.blur();
	// 	programSelect.value = program;
	// });
	// console.log("Saved");
}

programSelect.addEventListener('change', function(e) {
	if (programSelect.value == '@clear') {
		if (!confirm('Clear workspace?')) {
			programSelect.value = program;
			return;
		}
		localStorage.removeItem('program');
		program = '';
		setProgramXml('');
		programSelect.value = program;
		programSelect.blur();
	} else if (programSelect.value == '@save') {
		saveProgram();
	} else {
		// load program
		if (program == '' || document.body.classList.contains('changed')) {
			if (!confirm('Discard changes?')) {
				programSelect.value = program;
				return;
			}
		}
		let name = programSelect.value;
		let lastProgram = getProgramXml();
		programSelect.blur();
		try {
			setProgramXml(programs[name]);
			program = name;
			localStorage.setItem('program', name);
		} catch(e) {
			alert(e);
			setProgramXml(lastProgram);
			program = ''
			programSelect.value = program;
		}
		updateChanged();
	}
});
// ---------------------------------------------------------------------- Debug -------------------------------------------------------------------------------

// ---------------------------------------------------------------------- Auth --------------------------------------------------------------------------------
const loginBtn = document.getElementById('login-btn');
const loginModal = document.getElementById('login-modal');
const registerBtn = document.getElementById('reg-btn');
const registerModal = document.getElementById('register-modal');
const okBtn = document.getElementById('ok-btn');
const cancelBtn = document.getElementById('cancel-btn');
const confRegBtn = document.getElementById('confirm_reg-btn');
const regCancelBtn = document.getElementById('reg_cancel-btn');
const loginURL = "/auth";


loginBtn.addEventListener('click', () => {
    if (logged){
        logout();
        return;
    }
    loginModal.classList.add('show');
});

registerBtn.addEventListener('click', () => {
    registerModal.classList.add('show');
});

regCancelBtn.addEventListener('click', () => {
    registerModal.classList.remove('show');
});

// Register
confRegBtn.addEventListener('click', () => {
const username = document.getElementById('reg_username').value;
const password = document.getElementById('reg_password').value;
const request = {
	method: 'POST',
	headers: {
	'Content-Type': 'application/json; charset=UTF-8'
	},
	body: JSON.stringify({ username, password })
};

fetch("/add_user", request)
.then(response => response.json())
.then(data => {
  if (data.result) {
		alert("Пользователь добавлен успешно");
		registerModal.classList.remove('show');
  } else {
		alert(data.error)
  }
})
.catch(error => console.error('Error:', error));
});

// Login 
okBtn.addEventListener('click', () => {
const username = document.getElementById('username').value;
const password = document.getElementById('password').value;
const request = {
	method: 'POST',
	headers: {
	'Content-Type': 'application/json; charset=UTF-8'
	},
	body: JSON.stringify({ username, password })
};

fetch(loginURL, request)
.then(response => response.json())
.then(data => {
  if (data.token) {
	const expires = new Date(Date.now() + 3600000); // 1 hour
    document.cookie = `name=${username}; expires=${expires.toUTCString()}; path=/`;
	document.cookie = `token=${data.token}; expires=${expires.toUTCString()}; path=/`;
	console.log('Authenticated successfully!');
	gUsername = username;
    gToken = data.token;
    login();
  } else {
	console.error('Authentication failed!');
	alert("Ошибка авторизации!!!");
  }
})
.catch(error => console.error('Error:', error));

loginModal.classList.remove('show');
});

cancelBtn.addEventListener('click', () => {
loginModal.classList.remove('show');
}); 

// Проверяем наличие и валидность кук token при загрузке или обновлении страницы


function loadCheckToken() {
    const nameCookie = getCookie('name');
    const tokenCookie = getCookie('token');
    // Если куки token не найдены или просрочены, удаляем их
    if (!tokenCookie || !nameCookie) {
        logout();
        return;
    }

    const request = {
		method: 'POST',
		headers: {
		  'Content-Type': 'application/json; charset=UTF-8'
		},
		body: JSON.stringify({"username" : nameCookie, "token" :  tokenCookie})
	};
	
	fetch("/check", request)
	.then(response => response.json())
	.then(data => {
    if (data.result) {
      console.log('Token check successfully!');
      gUsername = nameCookie;
      gToken = tokenCookie;
      login();
    } else {
      console.error('Token check failed!');
    }
  })
  .catch(error => console.error('Error:', error));
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }

function deleteCookie(name) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
}


function login(){
    console.log("logged in");
    document.getElementById('login-btn').innerHTML = 'Logout';
    logged = true;
	// registerBtn.
	loadPrograms();
	registerBtn.style.display = "none";
}

function logout(){
    console.log("logged out");
    logged = false;
    document.getElementById('login-btn').innerHTML = 'Login';
    deleteCookie('token');
    deleteCookie('name');
	while (userPrograms.firstChild) {
		userPrograms.removeChild(userPrograms.firstChild);
	  }
	  registerBtn.style.display = "block";
}