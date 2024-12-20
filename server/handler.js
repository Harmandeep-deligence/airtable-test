require("dotenv").config();
const Airtable = require("airtable");

const base = new Airtable({ apiKey: process.env.AIRTABLE_ACCESS_TOKEN }).base(
  process.env.AIRTABLE_BASE_ID
);

function fetchClients() {
  return new Promise((resolve, reject) => {
    const allRecords = [];

    base("In Progress")
      .select({
        maxRecords: 10,
        view: "Grid view",
        fields: ["Full Name", "ID"],
      })
      .eachPage(
        (records, fetchNextPage) => {
          records.forEach((record) => {
            const fullName = record.get("Full Name");
            const id = record.get("ID");

            allRecords.push({ FullName: fullName, ID: id });
          });
          fetchNextPage();
        },
        (err) => {
          if (err) {
            reject("Error fetching records:", err);
          } else {
            resolve(allRecords);
          }
        }
      );
  });
}
//=======================================================================================================================
//fetch records with from another table by name from in progress table:

// function fetchClientRecords(name) {
//   return new Promise((resolve, reject) => {
//     const allRecords = [];

//     base("In Progress")
//       .select({
//         maxRecords: 10,
//         view: "Grid view",
//         filterByFormula: `{Customer} ='${name}'`,
//       })
//       .eachPage(
//         (records, fetchNextPage) => {
//           records.forEach((record) => {
//             const inProgressRecord = {
//               ...record.fields,
//               customerName: record.fields.Customer,
//               paymentLog: [],
//             };
//             allRecords.push(inProgressRecord);
//           });
//           fetchNextPage();
//         },
//         (err) => {
//           if (err) {
//             reject('Error fetching records from "In Progress":', err);
//           } else {
//             base("Payment Log")
//               .select({
//                 maxRecords: 10,
//                 view: "Grid view",
//                 filterByFormula: `{Customer} = '${name.trim()}'`,
//               })
//               .eachPage(
//                 (records, fetchNextPage) => {
//                   records.forEach((record) => {
//                     const paymentDetails = {
//                       PaymentAmount: record.get("Check Amount"),
//                       PaymentDate: record.get("Date"),
//                     };

//                     const clientRecord = allRecords.find(
//                       (r) => r.customerName === record.get("Customer")
//                     );

//                     if (clientRecord) {
//                       clientRecord.paymentLog.push(paymentDetails);
//                     }
//                   });
//                   fetchNextPage();
//                 },
//                 (err) => {
//                   if (err) {
//                     reject('Error fetching records from "Payment Log":', err);
//                   } else {
//                     resolve(allRecords);
//                   }
//                 }
//               );
//           }
//         }
//       );
//   });
// }
async function fetchClientRecords(name) {
  try {
    if (!name) {
      throw new Error("Customer name is required");
    }

    const MAX_RECORDS = 100;
    const VIEW_NAME = "Grid view";

    async function fetchTableRecords(tableName, formula) {
      const records = [];
      await base(tableName)
        .select({
          maxRecords: MAX_RECORDS,
          view: VIEW_NAME,
          filterByFormula: formula,
        })
        .eachPage((pageRecords, fetchNextPage) => {
          records.push(...pageRecords);
          fetchNextPage();
        });
      return records;
    }

    const [inProgressRecords, paymentLogRecords] = await Promise.all([
      fetchTableRecords("In Progress", `{Customer} = '${name}'`),
      fetchTableRecords("Payment Log", `{Customer} = '${name.trim()}'`),
    ]);

    const clientRecords = inProgressRecords.map((record) => ({
      ...record.fields,
      customerName: record.fields.Customer,
      paymentLog: [],
    }));

    const clientRecordsMap = new Map();
    for (const record of clientRecords) {
      clientRecordsMap.set(record.customerName, record);
    }

    for (const record of paymentLogRecords) {
      const customerName = record.get("Customer");
      const clientRecord = clientRecordsMap.get(customerName);

      if (clientRecord) {
        clientRecord.paymentLog.push({
          PaymentAmount: record.get("Check Amount"),
          PaymentDate: record.get("Date"),
        });
      }
    }

    return clientRecords;
  } catch (error) {
    throw new Error(`Failed to fetch client records: ${error.message}`);
  }
}
module.exports = { fetchClientRecords, fetchClients };
