//string baseUrl = "https://ipac.kvkli.cz/arl-li/cs/oai/?verb=ListRecords&metadataPrefix=oai_marcxml_cpk&set=CPK";
//var client = new HttpClient();
//var records = new List<BookRecord>();
//string requestUrl = baseUrl;
//int i = 0;
//while (!string.IsNullOrEmpty(requestUrl))
//{
//    string xml = await client.GetStringAsync(requestUrl);
//    XDocument doc = XDocument.Parse(xml);

//    foreach (var rec in doc.Descendants(XName.Get("record", "http://www.openarchives.org/OAI/2.0/")))
//    {
//        var book = ParseMarcXml(rec);
//        if (book != null)
//            records.Add(book);
//    }

//    var token = doc.Descendants(XName.Get("resumptionToken", "http://www.openarchives.org/OAI/2.0/")).FirstOrDefault();


//    if (token != null && !string.IsNullOrWhiteSpace(token.Value))
//    {
//        requestUrl = $"https://ipac.kvkli.cz/arl-li/cs/oai/?verb=ListRecords&resumptionToken={token.Value}";
//    }
//    else
//    {
//        requestUrl = null;
//    }

//    if (i % 1000 == 0)
//    {
//        Console.WriteLine($"Processed {i} requests...");
//        Console.WriteLine($"Fetched {records.Count} records so far...");
//    }
//    i++;

//}
//Console.WriteLine("Finished fetching records.");
//using (var writer = new StreamWriter("books.csv"))
//using (var csv = new CsvWriter(writer, CultureInfo.InvariantCulture))
//{
//    csv.WriteRecords(records);
//}

//Console.WriteLine($"Exported {records.Count} records to books.csv");