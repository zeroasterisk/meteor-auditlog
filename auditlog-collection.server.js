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
  options = options || {};
  var collectionName = options.name || COL._name || 'unknown';

  COL.after.update(function (userId, doc, fieldNames, modifier, options) {
    return AuditLog._update(
      collectionName,
      userId,
      doc,
      this.previous,
      fieldNames,
      modifier,
      options
    );
  });
  COL.after.remove(function(userId, doc){
    return AuditLog._remove(collectionName, userId, doc, options);
  });
  COL.after.insert(function(userId, doc) {
    return AuditLog._insert(collectionName, userId, doc, options);
  });
};

// --------------------------------------------------------------------------
// -- functions to transform data for AuditLog
// --------------------------------------------------------------------------

AuditLog._insert = function(collection, userId, doc, options) {
  check(collection, String);
  var r = AuditLog.getDiffOldNew({}, doc, options);
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
AuditLog._remove = function(collection, userId, doc, options) {
  check(collection, String);
  var r = AuditLog.getDiffOldNew(doc, {}, options);
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
  var r = AuditLog.getDiffOldNew(old, doc, options);
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
AuditLog.getDiffOldNew = function(oldDoc, newDoc, options) {
  if (options) {
    if (options.omit) {
      oldDoc = _.omit(oldDoc, options.omit);
      newDoc = _.omit(newDoc, options.omit);
    }
    if (options.transform && typeof options.transform === "function") {
      oldDoc = options.transform.bind({isOld: true}, oldDoc)();
      newDoc = options.transform.bind({isNew: true}, newDoc)();
    }
  }
  return Npm.require("deep-diff").diff(oldDoc, newDoc);
};

