import * as functions from 'firebase-functions';


export const onNewInit = functions.database
  .ref('/initLog/{key}')
  .onCreate((snap) => {
    const val = snap.val();
    const { moduleId, ip, timestamp, spoutVersion } = val as {moduleId: string, ip: string, timestamp: number, spoutVersion: string};
    const moduleRef = snap.ref.parent?.parent?.child('modules').child(moduleId);
    return moduleRef?.child('lastInit').set({ip, timestamp, spoutVersion})
  })

export const onNewReadout = functions.database
  .ref('/readouts/{readoutId}')
  .onCreate((snapshot, context) => {
    // Thinking here I should also just maintain a list of all the readoutIds by module to avoid a querying step?
    // To get really desomethingized I could maintain a full list of the readouts data under this structure too...
    const val = snapshot.val();
    const { readoutId } = context.params;
    const { moduleId } = val;
    
    const moduleRef = snapshot.ref.parent?.parent
      ?.child('modules')
      .child(moduleId);
    
    delete val.modlueId;
    
    const moduleUpdate = {
      lastReadout: val,
    };
    const idPush = moduleRef?.child('readoutIds').child(readoutId).set(true)
    const readoutUpdate = moduleRef?.update(moduleUpdate);
    const promises: Promise<any>[] = [];
    if (idPush) promises.push(idPush);
    if (readoutUpdate) promises.push(readoutUpdate);

    return Promise.all(promises)
  });
