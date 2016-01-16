// Write your tests here!
// Here is an example.
if (Meteor.isServer) {
  Tinytest.add("assignCallbacks basic", function (test) {
    var now = new Date();
    var TestCollection1 = new Mongo.Collection(null);
    AuditLog.assignCallbacks(TestCollection1);
    AuditLog.remove({});
    var id = TestCollection1.insert({demo:"one", "updatedAt": now});
    var log = AuditLog.findOne({docId: id});
    test.equal(log.docId, id, "docId");
    test.equal(log.collection, "unknown");
    test.equal(log.action, "insert");
    test.equal(log.result, [
      {"kind":"N","path":["demo"],"rhs":"one"},
      {"kind":"N","path":["updatedAt"],"rhs":now},
      {"kind":"N","path":["_id"],"rhs":id}
    ]);
  });
  Tinytest.add("assignCallbacks with options.omit", function (test) {
    var now = new Date();
    var options = {
      omit: ["createdAt", "updatedAt", "lastLogin"]
    };
    var TestCollection1 = new Mongo.Collection(null);
    AuditLog.assignCallbacks(TestCollection1, options);
    AuditLog.remove({});
    var id = TestCollection1.insert({demo:"two", "updatedAt": now});
    var log = AuditLog.findOne({docId: id});
    test.equal(log.docId, id, "docId");
    test.equal(log.collection, "unknown");
    test.equal(log.action, "insert");
    test.equal(log.result, [
      {"kind":"N","path":["demo"],"rhs":"two"},
      {"kind":"N","path":["_id"],"rhs":id}
    ]);
  });
  Tinytest.add("assignCallbacks with options.transform sync", function (test) {
    var now = new Date();
    var options = {
      transform: function(doc) {
        // inject new value based on "new" or "old" document context
        if (this.isNew) {
          doc.where = "new";
        }
        if (this.isOld) {
          doc.where = "old";
        }
        // transform existing value
        if (doc.updatedAt && _.isDate(doc.updatedAt)) {
          doc.updatedAt = doc.updatedAt.toString();
        }
        return doc;
      }
    };
    var TestCollection1 = new Mongo.Collection(null);
    AuditLog.assignCallbacks(TestCollection1, options);
    AuditLog.remove({});
    var id = TestCollection1.insert({demo:"three", "updatedAt": now});
    var log = AuditLog.findOne({docId: id});
    test.equal(log.docId, id, "docId");
    test.equal(log.collection, "unknown");
    test.equal(log.action, "insert");
    test.equal(log.result, [
      {"kind":"E","path":["where"],"lhs":"old","rhs":"new"},
      {"kind":"N","path":["demo"],"rhs":"three"},
      {"kind":"N","path":["updatedAt"],"rhs":now.toString()},
      {"kind":"N","path":["_id"],"rhs":id}
    ]);
  });
}
