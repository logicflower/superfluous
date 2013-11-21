"use strict";

var _ = require_vendor("underscore");
var React = require_vendor("react/react");
var JSXTransformer = require_vendor("react/JSXTransformer");
var async = require("async");
var $ = require("cheerio");

var fs = require("fs");
var context = require_core("server/context");
var bridge = require_core("server/bridge");

var template = require_core("server/template");
var readfile = require_core("server/readfile");
var packager = require_core("server/packager");
var Module = require("module").Module;


var __id = 0;

global.React = React;

var ReactLoader = {
  load_code: function(component) {
    var base_dir = "./components/" + component + "/";
    var filename = base_dir + component + ".js";
    var data = readfile(filename);
    if (data) {
      var transformed = JSXTransformer.transform(data);
      return transformed.code;
    }
  },
  load_package: function(component) {
    var base_dir = "./components/" + component + "/";
    var filename = base_dir + "package.json";
    var data = readfile(filename);
    return data;
  },

  load: function(component, options) {
    options = options || {};

    var code = ReactLoader.load_code(component);
    var ReactClass = new Module(component, "React");
    ReactClass._compile(code, component);

    var instance = new ReactClass.exports(options);

    var page = require_core("server/page");
    return {
      toString: function() {
        return page.async(function(flush) {
          React.renderComponentToString(instance, function(html) {
            bridge.call("core/client/react", "instantiate", component, options);
            var div = $("<div />");
            var innerDiv = $("<div />");
            div.append(innerDiv);
            innerDiv.attr('id', options.id);
            innerDiv.html(html);

            flush(div.html());
          });
        })();
      },
      instance: instance
    };
  },

  build: function(component, options) {
    var base_dir = "./components/" + component + "/";
    options = options || {};

    __id += 1;
    var id = "r" + __id;
    options.id = id;

    var cmp = ReactLoader.load(component, options);
    return cmp;
  }
};


global.$R = ReactLoader.build;
module.exports = ReactLoader;

