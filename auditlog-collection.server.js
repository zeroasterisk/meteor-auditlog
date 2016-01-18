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
  COL.after.update(function (userId, doc, fieldNames, modifier, updateOptions) {
    return AuditLog._update(
      collectionName,
      userId,
      doc,
      this.previous,
      fieldNames,
      modifier,
      updateOptions,
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

AuditLog._insert = function(collectionName, userId, doc, options) {
  check(collectionName, String);
  var r = AuditLog.getDiffOldNew({}, doc, options);
  /*
  console.log({
    what:"_insert()",
    userId: userId,
    doc: doc,
    old: {},
    r: r,
    options: options
  });
  */
  if (!r) return;
  var obj = {
    userId: userId,
    docId: doc._id || undefined,
    collection: collectionName,
    action: "insert",
    result: r
  };
  AuditLog.insert(obj, {validate: false});
};
AuditLog._remove = function(collectionName, userId, doc, options) {
  check(collectionName, String);
  var r = AuditLog.getDiffOldNew(doc, {}, options);
  /*
  console.log({
    what:"_remove()",
    userId: userId,
    doc: {},
    old: doc,
    r: r,
    options: options
  });
  */
  if (!r) return;
  var obj = {
    userId: userId,
    docId: doc._id || undefined,
    collection: collectionName,
    action: "remove",
    result: r
  };
  AuditLog.insert(obj, {validate: false});
};
AuditLog._update = function(collectionName, userId, doc, old, fieldNames, modifier, updateOptions, options) {
  var r = AuditLog.getDiffOldNew(old, doc, options);
  /*
  console.log({
    what:"_update()",
    userId: userId,
    doc: doc,
    old: old,
    r: r,
    modifier: modifier,
    updateOptions: updateOptions,
    options: options
  });
  */
  // only logs if something has changed
  if (!r) return;
  //TODO validate is failing for me on result... don't know why
  var obj = {
    userId: userId,
    docId: doc._id,
    collection: collectionName,
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

