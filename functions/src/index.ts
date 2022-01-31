import * as functions from 'firebase-functions';

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

export const onFirstReadout = functions.database
  .ref('/readoutsByModuleId/{moduleId}')
  .onCreate((snapshot, context) => {
    const val = snapshot.val();
    const { moduleId } = context.params;
    const seedModule = {
      name: 'UNAMED MODULE',
      lastReadout: val[Object.keys(val)[0]],
    };
    functions.logger.log('Initializing module');
    return snapshot.ref.parent?.parent
      ?.child('modules')
      .child(moduleId)
      .set(seedModule);
  });

export const onNewReadout = functions.database
  .ref('/readoutsByModuleId/{moduleId}/{readoutId}')
  .onCreate((snapshot, context) => {
    const val = snapshot.val();
    const { moduleId } = context.params;
    const moduleUpdate = {
      lastReadout: val,
    };
    functions.logger.log('Updating module');
    return snapshot.ref.parent?.parent?.parent
      ?.child('modules')
      .child(moduleId)
      .update(moduleUpdate);
  });
