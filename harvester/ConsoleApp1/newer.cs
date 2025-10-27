
//using System;
//using System.Collections.Concurrent;
//using System.Collections.Generic;
//using System.Linq;
//using System.Net.Http;
//using System.Threading.Channels;
//using System.Threading.Tasks;
//using System.Xml.Linq;
//using System.Threading.Channels;
//using System.Diagnostics;
//class HarvesterProgram
//{
//	static async Task Main(string[] args)
//	{
//		string baseUrl = "https://ipac.kvkli.cz/arl-li/cs/oai/?verb=ListRecords&metadataPrefix=oai_marcxml_cpk&set=CPK";
//		var client = new HttpClient();

//		var channel = Channel.CreateUnbounded<string>();
//		int i = 0;
//		_ = Task.Run(async () =>
//		{
//			Stopwatch stopwatch = Stopwatch.StartNew();
//			string requestUrl = baseUrl;
//			while (!string.IsNullOrEmpty(requestUrl))
//			{
//				string xml = await client.GetStringAsync(requestUrl);
//				await channel.Writer.WriteAsync(xml);

//				var doc = XDocument.Parse(xml);
//				var token = doc.Descendants(XName.Get("resumptionToken", "http://www.openarchives.org/OAI/2.0/"))
//							   .FirstOrDefault();

//				requestUrl = token != null && !string.IsNullOrWhiteSpace(token.Value)
//					? $"https://ipac.kvkli.cz/arl-li/cs/oai/?verb=ListRecords&resumptionToken={token.Value}"
//					: null;
//				if (i % 1000 == 0)
//				{
//					Console.WriteLine($"Processed {i} requests...");
//					Console.WriteLine($"Elapsed time: {stopwatch.Elapsed.TotalSeconds} seconds");

//				}
//				i++;
//			}
//			channel.Writer.Complete();
//			Console.WriteLine($"Finished fetching records. we Are on {i} requests!");
//			Console.WriteLine($"Elapsed time: {stopwatch.Elapsed.TotalSeconds} seconds");

//		});

//		// Multiple parser workers
//		var records = new ConcurrentBag<BookRecord>();
//		var parserTasks = Enumerable.Range(0, Environment.ProcessorCount).Select(async _ =>
//		{
//			await foreach (var xml in channel.Reader.ReadAllAsync())
//			{
//				var doc = XDocument.Parse(xml);
//				foreach (var rec in doc.Descendants(XName.Get("record", "http://www.openarchives.org/OAI/2.0/")))
//				{
//					var book = ParseMarcXml(rec);
//					if (book != null)
//						records.Add(book);
//				}
//			}
//		}).ToArray();

//		await Task.WhenAll(parserTasks);

//	}

//	static BookRecord ParseMarcXml(XElement record)
//	{
//		// MARCXML data lives inside <metadata><record>
//		XNamespace marcNs = "http://www.loc.gov/MARC21/slim";
//		var marc = record.Descendants(marcNs + "record").FirstOrDefault();
//		if (marc == null) return null;

//		string title = GetSubfield(marc, "245", "a");
//		string author = GetSubfield(marc, "100", "a");
//		string publisher = GetSubfield(marc, "260", "b");
//		string year = GetSubfield(marc, "260", "c");
//		string isbn = GetSubfield(marc, "020", "a");
//		string subjects = string.Join("; ", GetSubfields(marc, "650", "a"));
//		string description = GetSubfield(marc, "520", "a");

//		return new BookRecord
//		{
//			Title = title,
//			Author = author,
//			Publisher = publisher,
//			Year = year,
//			ISBN = isbn,
//			Subjects = subjects,
//			Description = description
//		};
//	}

//	static string GetSubfield(XElement record, string tag, string code)
//	{
//		return record.Elements().Where(e => e.Name.LocalName == "datafield" && e.Attribute("tag")?.Value == tag)
//			.Elements().Where(sf => sf.Name.LocalName == "subfield" && sf.Attribute("code")?.Value == code)
//			.Select(sf => sf.Value).FirstOrDefault();
//	}

//	static IEnumerable<string> GetSubfields(XElement record, string tag, string code)
//	{
//		return record.Elements().Where(e => e.Name.LocalName == "datafield" && e.Attribute("tag")?.Value == tag)
//			.Elements().Where(sf => sf.Name.LocalName == "subfield" && sf.Attribute("code")?.Value == code)
//			.Select(sf => sf.Value);
//	}

//	class BookRecord
//	{
//		public string Title { get; set; }
//		public string Author { get; set; }
//		public string Publisher { get; set; }
//		public string Year { get; set; }
//		public string ISBN { get; set; }
//		public string Subjects { get; set; }
//		public string Description { get; set; }
//	}
//}


//using System.Threading.Channels;
//using System.Threading.Tasks;
//using System.Xml.Linq;
//using System.Threading.Channels;
//using System.Diagnostics;
//class HarvesterProgram
//{
//	static async Task Main(string[] args)
//	{
//		string baseUrl = "https://ipac.kvkli.cz/arl-li/cs/oai/?verb=ListRecords&metadataPrefix=oai_marcxml_cpk&set=CPK"; var client = new HttpClient(); var channel = Channel.CreateUnbounded<string>(); int i = 0; _ = Task.Run(async () => { Stopwatch stopwatch = Stopwatch.StartNew(); string requestUrl = baseUrl; while (!string.IsNullOrEmpty(requestUrl)) { string xml = await client.GetStringAsync(requestUrl); await channel.Writer.WriteAsync(xml); var doc = XDocument.Parse(xml); var token = doc.Descendants(XName.Get("resumptionToken", "http://www.openarchives.org/OAI/2.0/")).FirstOrDefault(); requestUrl = token != null && !string.IsNullOrWhiteSpace(token.Value) ? $"https://ipac.kvkli.cz/arl-li/cs/oai/?verb=ListRecords&resumptionToken={token.Value}" : null; if (i % 1000 == 0) { Console.WriteLine($"Processed {i} requests..."); Console.WriteLine($"Elapsed time: {stopwatch.Elapsed.TotalSeconds} seconds"); } i++; } channel.Writer.Complete(); Console.WriteLine($"Finished fetching records. we Are on {i} requests!"); Console.WriteLine($"Elapsed time: {stopwatch.Elapsed.TotalSeconds} seconds"); }); // Multiple parser workers var records = new ConcurrentBag<BookRecord>(); var parserTasks = Enumerable.Range(0, Environment.ProcessorCount).Select(async _ => { await foreach (var xml in channel.Reader.ReadAllAsync()) { var doc = XDocument.Parse(xml); foreach (var rec in doc.Descendants(XName.Get("record", "http://www.openarchives.org/OAI/2.0/"))) { var book = ParseMarcXml(rec); if (book != null) records.Add(book); } } }).ToArray(); await Task.WhenAll(parserTasks); } static BookRecord ParseMarcXml(XElement record) { // MARCXML data lives inside <metadata><record> XNamespace marcNs = "http://www.loc.gov/MARC21/slim"; var marc = record.Descendants(marcNs + "record").FirstOrDefault(); if (marc == null) return null; string title = GetSubfield(marc, "245", "a"); string author = GetSubfield(marc, "100", "a"); string publisher = GetSubfield(marc, "260", "b"); string year = GetSubfield(marc, "260", "c"); string isbn = GetSubfield(marc, "020", "a"); string subjects = string.Join("; ", GetSubfields(marc, "650", "a")); string description = GetSubfield(marc, "520", "a"); return new BookRecord { Title = title, Author = author, Publisher = publisher, Year = year, ISBN = isbn, Subjects = subjects, Description = description }; } static string GetSubfield(XElement record, string tag, string code) { return record.Elements().Where(e => e.Name.LocalName == "datafield" && e.Attribute("tag")?.Value == tag) .Elements().Where(sf => sf.Name.LocalName == "subfield" && sf.Attribute("code")?.Value == code) .Select(sf => sf.Value).FirstOrDefault(); } static IEnumerable<string> GetSubfields(XElement record, string tag, string code) { return record.Elements().Where(e => e.Name.LocalName == "datafield" && e.Attribute("tag")?.Value == tag) .Elements().Where(sf => sf.Name.LocalName == "subfield" && sf.Attribute("code")?.Value == code) .Select(sf => sf.Value); } class BookRecord { public string Title { get; set; } public string Author { get; set; } public string Publisher { get; set; } public string Year { get; set; } public string ISBN { get; set; } public string Subjects { get; set; } public string Description { get; set; } } }
//		using System.Xml.Linq;
//using System.Threading.Channels;
//using System.Diagnostics;
//class HarvesterProgram { static async Task Main(string[] args) { string baseUrl = "https://ipac.kvkli.cz/arl-li/cs/oai/?verb=ListRecords&metadataPrefix=oai_marcxml_cpk&set=CPK"; var client = new HttpClient(); var channel = Channel.CreateUnbounded<string>(); int i = 0; _ = Task.Run(async () => { Stopwatch stopwatch = Stopwatch.StartNew(); string requestUrl = baseUrl; while (!string.IsNullOrEmpty(requestUrl)) { string xml = await client.GetStringAsync(requestUrl); await channel.Writer.WriteAsync(xml); var doc = XDocument.Parse(xml); var token = doc.Descendants(XName.Get("resumptionToken", "http://www.openarchives.org/OAI/2.0/")).FirstOrDefault(); requestUrl = token != null && !string.IsNullOrWhiteSpace(token.Value) ? $"https://ipac.kvkli.cz/arl-li/cs/oai/?verb=ListRecords&resumptionToken={token.Value}" : null; if (i % 1000 == 0) { Console.WriteLine($"Processed {i} requests..."); Console.WriteLine($"Elapsed time: {stopwatch.Elapsed.TotalSeconds} seconds"); } i++; } channel.Writer.Complete(); Console.WriteLine($"Finished fetching records. we Are on {i} requests!"); Console.WriteLine($"Elapsed time: {stopwatch.Elapsed.TotalSeconds} seconds"); }); // Multiple parser workers var records = new ConcurrentBag<BookRecord>(); var parserTasks = Enumerable.Range(0, Environment.ProcessorCount).Select(async _ => { await foreach (var xml in channel.Reader.ReadAllAsync()) { var doc = XDocument.Parse(xml); foreach (var rec in doc.Descendants(XName.Get("record", "http://www.openarchives.org/OAI/2.0/"))) { var book = ParseMarcXml(rec); if (book != null) records.Add(book); } } }).ToArray(); await Task.WhenAll(parserTasks); } static BookRecord ParseMarcXml(XElement record) { // MARCXML data lives inside <metadata><record> XNamespace marcNs = "http://www.loc.gov/MARC21/slim"; var marc = record.Descendants(marcNs + "record").FirstOrDefault(); if (marc == null) return null; string title = GetSubfield(marc, "245", "a"); string author = GetSubfield(marc, "100", "a"); string publisher = GetSubfield(marc, "260", "b"); string year = GetSubfield(marc, "260", "c"); string isbn = GetSubfield(marc, "020", "a"); string subjects = string.Join("; ", GetSubfields(marc, "650", "a")); string description = GetSubfield(marc, "520", "a"); return new BookRecord { Title = title, Author = author, Publisher = publisher, Year = year, ISBN = isbn, Subjects = subjects, Description = description }; } static string GetSubfield(XElement record, string tag, string code) { return record.Elements().Where(e => e.Name.LocalName == "datafield" && e.Attribute("tag")?.Value == tag) .Elements().Where(sf => sf.Name.LocalName == "subfield" && sf.Attribute("code")?.Value == code) .Select(sf => sf.Value).FirstOrDefault(); } static IEnumerable<string> GetSubfields(XElement record, string tag, string code) { return record.Elements().Where(e => e.Name.LocalName == "datafield" && e.Attribute("tag")?.Value == tag) .Elements().Where(sf => sf.Name.LocalName == "subfield" && sf.Attribute("code")?.Value == code) .Select(sf => sf.Value); } class BookRecord { public string Title { get; set; } public string Author { get; set; } public string Publisher { get; set; } public string Year { get; set; } public string ISBN { get; set; } public string Subjects { get; set; } public string Description { get; set; } } }