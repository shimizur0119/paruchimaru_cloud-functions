import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
admin.initializeApp();

import axios, { AxiosRequestConfig } from "axios";

// export const addMessage = functions.https.onRequest(async (req, res) => {
//   const original = req.query.text;
//   const writeResult = await admin
//     .firestore()
//     .collection("messages")
//     .add({ original: original });
//   res.json({ result: `Message with ID: ${writeResult.id} added.` });
// });

// export const makeUppercase = functions.firestore
//   .document("/messages/{documentId}")
//   .onCreate((snap, context) => {
//     const original = snap.data().original;

//     functions.logger.log("Uppercasing", context.params.documentId, original);
//     functions.logger.info("Uppercasing", context.params.documentId, original);

//     const uppercase = original.toUpperCase();

//     functions.logger.info("test!!", "test!!", "test!!");
//     functions.logger.log(uppercase);
//     console.log("foo");

//     return snap.ref.set({ uppercase }, { merge: true });
//   });

export const testFunc = functions.https.onRequest(async (request, response) => {
  functions.logger.log("testFunc!!");
});

export const testDataAdd = functions.https.onRequest(async (req, res) => {
  const writeResult = await admin
    .firestore()
    .collection("users")
    .add({
      test: "init",
      displayName: "test",
      email: "test@test.com",
      title_list: ["shaman king", "react", "左ききのエレン"],
      checkDatas: {
        0: {
          title: "init",
          new_ids: ["new_init-id"],
          old_ids: ["init-id"],
        },
        1: {
          title: "init",
          new_ids: ["new_init-id"],
          old_ids: ["init-id"],
        },
        2: {
          title: "init",
          new_ids: ["new_init-id"],
          old_ids: ["init-id"],
        },
      },
    });
  res.json({ result: `${writeResult.id}` });
});

export const checkFunc = functions.pubsub
  .schedule("every day 00:00")
  .onRun(async (context) => {
    functions.logger.info("every-day-check!!");
    const userRef = admin.firestore().collection("users");
    await userRef.get().then(async (querySnapshot: any) => {
      querySnapshot.forEach((doc: any, index: number) => {
        functions.logger.log({
          title: "log-1",
          index: index,
          data: doc.data(),
          id: doc.id,
        });
        const user_data = doc.data();
        const { title_list } = user_data;
        title_list.map(async (title: string, i: number) => {
          const axiosConf: AxiosRequestConfig = {
            url: encodeURI(
              `https://www.googleapis.com/books/v1/volumes?q=intitle:${title}&projection=lite&orderBy=newest&printType=books`
            ),
            method: "get",
            timeout: 1000,
          };
          const response = await axios(axiosConf);
          const data: any = response.data;
          const ids = data.items.map((e: any) => e.id);
          const key = `checkDatas.${i}`;
          const update_value = {
            [key]: {
              title: title,
              new_ids: ids,
              old_ids: user_data.checkDatas[`${i}`].new_ids,
            },
          };
          await admin
            .firestore()
            .collection("users")
            .doc(doc.id)
            .update(update_value);
        });
      });
    });

    console.log("db更新完了");
    await admin
      .firestore()
      .collection("users")
      .get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const { checkDatas } = data;
          console.log("after func", checkDatas);
        });
      });
  });
