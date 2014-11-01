Function.prototype.inheritsFrom = function( parentClassOrObject ){ 
	if ( parentClassOrObject.constructor == Function ) 
	{ 
		//Normal Inheritance 
		this.prototype = new parentClassOrObject;
		this.prototype.constructor = this;
		this.prototype.parent = parentClassOrObject.prototype;
	} 
	else 
	{ 
		//Pure Virtual Inheritance 
		this.prototype = parentClassOrObject;
		this.prototype.constructor = this;
		this.prototype.parent = parentClassOrObject;
	} 
	return this;
} 

var UTIL = (function() {
	function dateComparator(dateA, dateB) {
		dateA = dateA.split("/");
		dateB = dateB.split("/");
		var dateAMonth = parseInt(dateA[0]);
		var dateBMonth = parseInt(dateB[0]);
		var dateAYear = parseInt(dateA[2]);
		var dateBYear = parseInt(dateB[2]);

		if (dateAYear != dateBYear) {
			return dateAYear > dateBYear ? 1 : -1;
		} else if (dateAMonth != dateBMonth) {
			return dateAMonth > dateBMonth ? 1 : -1; 
		} else {
			var dateAday = parseInt(dateA[1]);
			var dateBDay = parseInt(dateB[1]);
			if (dateAday > dateBDay)
				return 1;
			else if (dateAday < dateBDay)
				return -1;
			else
				return 0;
		}
	}

	function dateObjToString(date) {
		var year = date.getFullYear();
		var month = date.getMonth() + 1;
		var day = date.getDate();

		var s = month + "/" + day + "/" + year;

		return s;
	}

	return {
		dateComparator: dateComparator,
		dateObjToString: dateObjToString
	}
})();
// invoke parent constructor of this
function Super(obj) {
	if (obj.parent) return obj.parent.constructor;
}


function Task(title, details, date, color, past) {
	this.title = title || "no title";
	this.details = details || "no details";
	// pad year to 4 digits if only 2 digits
	this.date = date || "10/24/2014";
	this.color = color || "grey";

	var nodeHTML = "<div class=\"task\">" + 
					"<span class=\"title\">" + this.title + "</span>" +
					"<span class=\"duration\">" + this.date +"</span>";
	this.node = $(nodeHTML);
	this.node.addClass(this.color);

	var self = this;
}
// return 1 if this is greater, -1 if other is greater
Task.prototype.compare = function(other) {
	return UTIL.dateComparator(this.date, other.date);
}
Task.prototype.toString = function() {
	return "{Task Object // Title: " + this.title + ", details:" + this.details + ", date: " + this.date + " }";
}
Task.prototype.domNode = function() {
	return this.node;
}
Task.prototype.destroy = function() {
	this.node.remove();
	this.node = null;
}
Task.prototype.markPast = function() {
	this.node.addClass("past");
}

function Project(container, title, m) {
	this.tasks = [];
	this.title = title || "no project title";
	this.date = UTIL.dateObjToString(new Date());

	var node = "<div class=\"project emptyproject\">" +
			"<h2>" + this.title + "</h2>" +
			"<h3 class=\"emptyprojectmsg\">This project has no tasks</h3>" +
			"<div class=\"projecttasks\"></div>" +
			"</div>";
	this.context = $(node);
	container.append(this.context);
	this.container = this.context.children(".projecttasks");
	this.m = m;
}
Project.prototype.addTask = function(task) {
	if (this.tasks.length === 0) {
		this.context.removeClass("emptyproject");
	}

	for(var i = 0; i < this.tasks.length; i++) {
		var currTask= this.tasks[i];
		var cmp = currTask.compare(task);
		if (cmp === 1) {
			this.tasks.splice(i, 0, task);

			task.domNode().insertBefore(this.container.children().eq(i));
			this.highlightTasks([i]);
			return;
		}
	}
	this.tasks.push(task);
	this.container.append(task.domNode());

	this.highlightTasks([this.tasks.length-1]);

	task.node.bind("mousedown",function(e) {
		e.preventDefault();
		if(e.which === 2) {
			task.destroy();
		}
	});
}
Project.prototype.highlightTasks = function(indices) {
	if(indices) {
		for(var i = 0 ; i < indices.length; i++) {
			var index = indices[i];
			if(index >= 0 && index < this.tasks.length) {
				var currTask = this.tasks[index];

				if(this.checkTaskPast(currTask))
					currTask.markPast();
				if (this.checkTaskImportant(currTask)) {
					this.m.notify(currTask, this.title);
				}
			}
		}
	} else {
		for(var i = 0 ; i < this.tasks.length; i++) {
			var currTask = this.tasks[i];
			if(this.checkTaskPast(currTask))
				currTask.markPast();
			if (this.checkTaskImportant(currTask)) {
				console.log("another important");
				this.m.notify(currTask, this.title)
			}
		}
	}
}
Project.prototype.checkTaskPast = function(task) {
	var cmp = UTIL.dateComparator(task.date, this.date);
	if(cmp < 0)
		return true;
}
Project.prototype.checkTaskImportant = function(task) {
	var cmp = UTIL.dateComparator(task.date, this.date);
	if (cmp === 0)
		return true;
}

Project.prototype.getNotifications = function() {
	var notifs = [];
	for (var i = 0 ; i < this.tasks.length; i++) {
		var task = this.tasks[i];

		var comparison = UTIL.dateComparator(task.date, this.date);
		if (comparison === 0) {
			notifs.push(new Notification(task, this.title ));
		} 
	}

	return notifs;
}
Project.prototype.print = function() {
	for(var i = 0; i < this.tasks.length; i++) {
		console.log(this.tasks[i].toString());
	}
}
Project.prototype.destroy = function() {
	for(var i = 0; i < this.tasks.length; i++) {
		this.tasks[i].destroy();
	}
	this.context.remove();
}
function Notification(task, projectTitle) {
	this.task = task || new Task();
	this.projectTitle = projectTitle || "unknown projectTitle";
}

function NotificationQueue() {
	this.notifs = [];
	this.upToDate = false;

	var self = this;
	setInterval(function() {
		self.update();
	}, 5000);
}
NotificationQueue.prototype.push = function(notif) {
	this.notifs.push(notif);
	this.upToDate = false;
	console.log(this.upToDate);
}
NotificationQueue.prototype.update = function() {
	if (!this.upToDate) {
		var currNotif = this.notifs[this.notifs.length - 1];
		var currProject = currNotif.projectTitle;
		var currTask = currNotif.task.title;
		var node = "<div class=\"notification\">" + currTask + "</div>";
		node = $(node)
		node.data("project", currProject);
		$("#notifications").append(node);
	
		this.upToDate = true;
	}
}
NotificationQueue.prototype.viewingContext = function(context) {
	this.context = context;
}

NotificationQueue.prototype.print = function() {
	for (var i = 0 ; i < this.notifs.length; i++) {
		console.log(this.notifs[i]);
	}
}

function Manager() {
	this.projects = {};
	this.currProject = -1;
	var self = this;

	var ENTRY_FORM_ID = "entry_form";
	$("#entry_submit").click(function(e) {
		e.preventDefault();

		var p = self.getCurrContext();
		if (!p) {
			console.log("Manager: no context");
		}

		var entry_title_selector = "#" + ENTRY_FORM_ID + " [name=entry_title]";
		var entry_duration_selector = "#" + ENTRY_FORM_ID + " [name=entry_duration]";
		var entry_color_selector = "#" + ENTRY_FORM_ID + " select";

		var entryTitle = $(entry_title_selector).val();
		var entryDuration = $(entry_duration_selector).val();
		var entryColor = $(entry_color_selector).val();

		p.addTask(new Task(entryTitle, null, entryDuration, entryColor));
	});

	$("#project_submit").click(function(e) {
		e.preventDefault();

		var project_title_selector = "#projectui [name=project_title]";
		var inputVal = $(project_title_selector).val();
		var projectTitle = inputVal || "no project title";

		var tasksContainer = $("#tasks");
		var p = new Project(tasksContainer, projectTitle);

		if(!self.addProject(p)) {
			p.destroy();
			alert("Cannot add project: \"" + p.title + "\". A project with the same name already exists.");
		}
	});
}
Manager.prototype.notify = function(task, projectTitle) {
	console.log('unimplemented');
	// update the notif q
}
Manager.prototype.addProject = function(project) {
	var isDuplicate = this.containsProject(project.title);
	if(isDuplicate) {
		return false;
	}

	this.projects[project.title] = project;
	this.setContext(project.title);

	var self = this;
	var optionNode = "<option value=\"" + project.title +"\">" + project.title + "</option>";
	$("#projectselect").append(optionNode);
	$("#projectselect").unbind();
	$("#projectselect").change(function() {
		var selectedContext = $(this).val();
		self.setContext(selectedContext);
	});

	$("#projectselect").val(this.currProject);

	return true;
}
Manager.prototype.getCurrContext = function() {
	if (!this.projects || this.projects.length === 0)
		return null;

	return this.projects[this.currProject];
}
Manager.prototype.setContext = function(ctx) {
	this.currProject = ctx;

	var p = this.projects[this.currProject];
	$("#projectname").empty();
	$("#projectname").append(p.title);
	$("#currdate").empty().append(p.date);

	$(".project").addClass("inactive");
	p.container.parent().removeClass("inactive");
}
Manager.prototype.containsProject = function(projectTitle) {
	return projectTitle in this.projects;
}

$(document).ready(function() {

	var m = new Manager();

	var tasksContainer = $("#tasks");

	var p = new Project(tasksContainer, "Become a kungfu master", m);
	var p2 = new Project(tasksContainer, "Open a Restaurant", m);
	

	
	m.addProject(p);
	m.addProject(p2);

	p.addTask(new Task());
	p.addTask(new Task("Parents killed by ninjas", null, "10/2/1985"));
	p.addTask(new Task("Beg kungfu master to be student", null, "4/2/1991"));
	p.addTask(new Task("Become master of kickboxing", null, "9/11/2001"));
	p.addTask(new Task("Win UFC", null, "6/23/2004"));
	p.addTask(new Task("Seek revenge", null, "10/31/2014"));
	p.addTask(new Task("Death", null, "10/31/2017"));
	p2.addTask(new Task("Dream", null, "11/3/1999"));
	p2.addTask(new Task("Drop out of college", null, "3/11/2012"));
	p2.addTask(new Task("Go to france", null, "4/16/2013"));
	p2.addTask(new Task("Enroll in culinary school", null, "7/16/2013"));
	p2.addTask(new Task("Graduate from culinary school", null, "10/31/2014"));
	p2.addTask(new Task("Buy a plot of land", null, "11/1/2014"));
	p2.addTask(new Task("Print a menu", null, "3/11/2017"));
	p2.addTask(new Task("Grand opening!", null, "8/11/2018"));
	p2.addTask(new Task("Bankruptcy. ", null, "6/7/2022"));

	var ENTRY_FORM_ID = "entry_form";
	$("#generate_random_shit").click(function(e){
		e.preventDefault();

		var verbs = ["Eat", "Drink", "Finish", "Remember", "Write", "Choose", "Notify", "Select"];
		var verb = verbs[Math.floor(Math.random() * verbs.length)];
		var nouns = ["Dog", "Homework", "Car", "Bob", "Shelf", "Phone", "Bamboo Tree", "Notebook", "Picture Frame",
			"table"];
		var noun = nouns[Math.floor(Math.random() * nouns.length)];
		var locations = ["Church", "the Cafe", "School", "Bus Stop", "Library", "Observatory", "Gym"];
		var location = locations[Math.floor(Math.random() * locations.length)];
		var title = verb + " " + noun + " at " + location;
		var entry_title_selector = "#" + ENTRY_FORM_ID + " [name=entry_title]";
		$(entry_title_selector).val(title);


		var month = Math.floor(Math.random() * 12) + 1;
		var day = Math.floor(Math.random() * 29) + 1;
		var year = 2014;

		var duration = month + "/" + day + "/" + year;
		var entry_duration_selector = "#" + ENTRY_FORM_ID + " [name=entry_duration]";
		$(entry_duration_selector).val(duration);

		var colors = ["purple", "green", "blue", "orange", "grey", "red"];
		var color = colors[Math.floor(Math.random() * colors.length)];
		var entry_color_selector = "#" + ENTRY_FORM_ID + " select";
		$(entry_color_selector).val(color);
	});
});