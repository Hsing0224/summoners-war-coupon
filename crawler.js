const fs = require('fs');
const axios = require('axios');

function getLastRecord() {
	// 讀取 JSON 檔案
	fs.readFile('record.json', 'utf8', (err, data) => {
		if (err) {
			console.error('Error reading JSON file:', err);
		} else {
			// 解析 JSON 字串為 JavaScript 物件
			if(data) {
				const crawledData = JSON.parse(data);
				return crawledData;
			} else {
				return [];
			}
		}
	});
}

function writeRecord(data) {
	const jsonData = JSON.stringify(data, null, 2);

	// 寫入 JSON 檔案
	fs.writeFile('record.json', jsonData, (err) => {
		if (err) {
			console.error('Error writing JSON file:', err);
		} else {
			console.log('Data has been written to crawled_data.json');
		}
	});
}

axios.get('https://swq.jp/_special/rest/Sw/Coupon')
  .then(response => {
		const data = response.data?.data;
		if(data) {
			const lastRecord = getLastRecord() || [];
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
			}
		}
  })
  .catch(error => {
    console.error('Error fetching JSON data:', error);
  });