const fs = require('fs');
const axios = require('axios');
function getLastRecord() {
  return new Promise((resolve, reject) => {
    fs.readFile('record.json', 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading JSON file:', err);
        resolve([]);
      } else {
        if (typeof data === 'object') {
          const crawledData = JSON.parse(data);
          resolve(crawledData);
        } else {
          resolve([]);
        }
      }
    });
  });
}

function writeRecord(data) {
	const jsonData = JSON.stringify(data, null, 2);

	// 寫入 JSON 檔案
	fs.writeFile('record.json', jsonData, (err) => {
		if (err) {
			console.error('Error writing JSON file:', err);
		} else {
			console.log('Data has been written to recode.json');
		}
	});
}

axios.get('https://swq.jp/_special/rest/Sw/Coupon')
  .then(async response => {
		const data = response.data?.data;
		if(data) {
			const lastRecord = await getLastRecord();

			const result = data
				.filter(x => x.Status === 'verified')
				.map(({Label, Sw_Coupon__}) => { return { Label, Sw_Coupon__ }});

			const lastDataIndex = lastRecord.length
				? result.findIndex(item => item.Label === lastRecord[0].Label)
				: -1;

			const uniqueData = lastDataIndex === -1
				? result
				: result.slice(0, lastDataIndex);

			if(uniqueData.length) {
				writeRecord(uniqueData[0]);

				const outputLinkArray = uniqueData.map((x) => `http://withhive.me/313/${x.Label}`);
				// 輸出到控制台，GitHub Actions 可以捕獲這個輸出
				console.log('UNIQUE_DATA:' + JSON.stringify(outputLinkArray));
			} else {
        console.log('UNIQUE_DATA:[]');
      }

		}
  })
  .catch(error => {
    console.error('Error fetching JSON data:', error);
  });