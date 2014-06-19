"use strict";

var Template = function (template, file) {
	this.cache = {};
	this.name = file;
	this.template = $(template);
};

Template.__templates = {};

Template.event = new EventListener();

Template.ref = function (template) {
	return Template.__templates[template];
};

Template.load = function (file) {
	if (Template.__templates[file])
		return Template.__templates[file];

	$.ajax({
		async: false,
		url: ExtensionURL('template/' + file + '.html')
	}).done(function (template) {
			Template.__templates[file] = new Template(template, file);

			Template.event.trigger('load.' + file, template);
		})
		.fail(function (error) {
			LogError(['unable to load template file', file, error]);
		});

	return Template.__templates[file];
};

Template.loaded = function (file) {
	return Template.__templates.hasOwnProperty(file);
};

Template.create = function (template, section, data) {
	if (!Template.loaded(template))
		throw new Error('template file not loaded - ' + template);

	return Template.__templates[template].create(section, data);
};

Template.prototype.create = function (section, data) {
	// Simple JavaScript Templating
	// John Resig - http://ejohn.org/ - MIT Licensed

	var fn;

	if (data !== false && typeof data !== 'object')
		data = {};

	if (!/\W/.test(section)) {
		if(section in this.cache)
			fn = this.cache[section];
		else {
			var template = this.get(section);

			if (!template.length)
				throw new Error('section not found in template: ' + this.name + ' - ' + section);
	
			fn = this.create(template.text(), false);
		}
	} else
		fn = this.cache[section] = new Function('self', "var p=[];p.push('" +
			section
				.replace(/[\r\t\n]/g, " ")
				.replace(/'(?=[^%]*%>)/g, "\t")
				.replace(/'/g, "\\'")
				.replace(/\t/g, "'")
				.replace(/<%=(.+?)%>/g, "',$1,'")
				.replace(/<%/g, "');")
				.replace(/%>/g, "p.push('")
			+ "');return $(p.join(''));");

	section = undefined;

	return data ? fn(data) : fn;
};

Template.prototype.get = function (section) {
	return this.template.filter('#' + section);
};

Template.load('main');


// Temporarily globalize Template
globalPage.Template = Template;