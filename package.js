Package.describe({
  name: "zeroasterisk:auditlog",
  version: "0.0.1",
  summary: "Simple, generic, extensible audit logging on collection insert, update, upsert, remove",
  git: "https://github.com/zeroasterisk/meteor-auditlog",
  documentation: "README.md"
});


Npm.depends({
  "deep-diff": "0.3.3"
});

Package.onUse(function(api) {
  api.versionsFrom("1.2.1");
  api.use("ecmascript");
  api.use(["meteor", "mongo", "underscore"], ["client", "server"]);
  api.use(["aldeed:collection2@2.5.0"], ["server"]);
  api.addFiles("auditlog-collection.both.js", ["client", "server"]);
  api.addFiles("auditlog-collection.server.js", "server");
  api.addFiles("auditlog-methods.server.js", "server");
  //api.addFiles("auditlog-helpers.client.js", "client");
  api.export("AuditLog");
});

Package.onTest(function(api) {
  api.use("ecmascript");
  api.use("tinytest");
  api.use("zeroasterisk:auditlog");
  api.addFiles("auditlog-tests.js");
});
