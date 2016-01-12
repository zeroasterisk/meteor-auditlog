# AuditLog

    meteor add zeroasterisk:auditlog

Then you need to assign these hooks to your collections, on the server only:

### Server:

    Meteor.users.before.update(function (userId, doc, fieldNames,modifier) {
      return AuditLog.updateDiff(userId, doc, fieldNames, modifier, "Users");
    });

    Meteor.users.after.remove(function(userId, doc){
      return AuditLog.deletion(userId, doc, "Users");
    });

    Meteor.users.after.insert(function(userId, doc) {
      return AuditLog.creation(userId, doc, "Users");
    });

Sadly, you will have to do this for every collection, independently:

    Timecards.before.update(function (userId, doc, fieldNames,modifier) {
      return AuditLog.updateDiff(userId, doc, fieldNames, modifier, "Timecards");
    });

    Timecards.after.remove(function(userId, doc){
      return AuditLog.deletion(userId, doc, "Timecards");
    });

    Timecards.after.insert(function(userId, doc) {
      return AuditLog.creation(userId, doc, "Timecards");
    });

You can also audit any extra "custom" events you want... if you wanted to:

### Server:

    AuditLog.insert({
      userId: Meteor.userId(),
      docId: somerecord._id,
      action: "whatever",
      collection: "somecollection",
      result: [
        {
          ...
        }
      ]
    });

### Client:

    Meteor.call('AuditLog', {
      docId: somerecord._id,
      action: "whatever",
      collection: "somecollection",
      result: [
        {
          ...
        }
      ]
    });

## UI

TODO: register a generic helper for displaying the differences in documents...

