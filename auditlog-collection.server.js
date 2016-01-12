// setup schemas
AuditLogSchema = new SimpleSchema({
  userId: {
    type: SimpleSchema.RegEx.Id,
    label: "user performing action",
    optional: true,
    index: true
  },
  docId: {
    type: SimpleSchema.RegEx.Id,
    label: "Document Id",
    optional: true,
    index: true
  },
  action: {
    type: String,
    label: "logged action",
    index: true
  },
  result: {
    type: [Object],
    label: "Result",
    optional: true,
    blackbox: true
  },
  "result.$.field": {
    type: String,
    optional: true
  },
  "result.$.kind": {
    type: String,
    optional: true
  },
  /*
  "result.$.path": {
    type: [String],
    optional: true,
    blackbox: true
  },
  "result.$.lhs": {
    type: [String],
    optional: true,
    blackbox: true
  },
  "result.$.rhs": {
    type: [String],
    optional: true,
    blackbox: true
  },
  */
  collection: {
    type: String,
    label: "Collection",
    index: true
  },
  timestamp: {
    type: Date,
    label: "Created At",
    autoValue: function() {
      return new Date;
    }
  },
  expiresIn: {
    type: Number,
    label: "Expires in",
    optional: true
  }
});

AuditLog.attachSchema(AuditLogSchema);

// --------------------------------------------------------------------------
// -- functions to facilitate attachment to model
// --------------------------------------------------------------------------

AuditLog.assignCallbacks = function(COL, options) {

  COL.after.update(function (userId, doc, fieldNames, modifier, options) {
    return AuditLog._update(
      COL._name,
      userId,
      doc,
      this.previous,
      fieldNames,
      modifier,
      options
    );
  });
  COL.after.remove(function(userId, doc){
    return AuditLog._remove(COL._name, userId, doc);
  });
  COL.after.insert(function(userId, doc) {
    return AuditLog._insert(COL._name, userId, doc);
  });
};

// --------------------------------------------------------------------------
// -- functions to transform data for AuditLog
// --------------------------------------------------------------------------

AuditLog._insert = function(collection, userId, doc) {
  check(collection, String);
  var r = AuditLog.getDiffOldNew({}, doc);
  if (!r) return;
  var obj = {
    userId: userId,
    docId: doc._id || undefined,
    collection: collection,
    action: "insert",
    result: r
  };
  AuditLog.insert(obj, {validate: false});
};
AuditLog._remove = function(collection, userId, doc) {
  check(collection, String);
  var r = AuditLog.getDiffOldNew(doc, {});
  if (!r) return;
  var obj = {
    userId: userId,
    docId: doc._id || undefined,
    collection: collection,
    action: "remove",
    result: r
  };
  AuditLog.insert(obj, {validate: false});
};
AuditLog._update = function(collection, userId, doc, old, fieldNames, modifier, options) {
  var r = AuditLog.getDiffOldNew(old, doc);
  // only logs if something has changed
  if (!r) return;
  //TODO validate is failing for me on result... don't know why
  var obj = {
    userId: userId,
    docId: doc._id,
    collection: collection,
    action: "update",
    modifier: modifier,
    options: options,
    result: r
  };
  AuditLog.insert(obj, {validate: false});
};
AuditLog.getDiffOldNew = function(oldDoc, newDoc) {
  return Npm.require("deep-diff").diff(oldDoc, newDoc);
};

