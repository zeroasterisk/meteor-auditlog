# AuditLog

    meteor add zeroasterisk:auditlog

Then you need to assign these hooks to your collections, on the server only:

### Server:

    AuditLog.assignCallbacks(Meteor.users, {
      // these fields will not be considered/tracked for a diff (add, edit, del)
      omit: ['createdAt', 'updatedAt', 'lastLogin']
      // this function will be applied to both new and old documents before diff
      transform: function(doc) {
        if (this.isNew) {
          // transform can be customized for new docs only
        }
        if (this.isOld) {
          // transform can be customized for old docs only
        }
        // full doc is available for manipulation
        _.each(doc, function(v, k) {
          if (_.isDate(v)) {
            // not required, but a convenient transform
            doc[k] = v.toString();
          }
          if (_.isObject(v)) {
            // omit any fields you want
            delete doc[k];
          }
          if (_.isString(v) && k.indexOf('name') !== -1) {
            // perhaps we don't care about case chaneges on "name" fields
            doc[k] = v.toLowerCase();
          }
        });
        // must return the doc, after transform
        return doc;
      }
    });

You will have to do this for every collection, independently... allowing you to
set various options as needed:

    AuditLog.assignCallbacks(Posts);
    AuditLog.assignCallbacks(Comments, { omit: ['likes'] });
    AuditLog.assignCallbacks(Profile,  { omit: ['updatedAt', 'secrets'] });

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

