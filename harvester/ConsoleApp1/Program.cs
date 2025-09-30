using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Channels;
using System.Threading.Tasks;
using System.Xml.Linq;
using System.Diagnostics;
using System.IO;

class HarvesterProgram
{
    static async Task Main(string[] args)
    {
        string baseUrl = "https://ipac.kvkli.cz/arl-li/cs/oai/?verb=ListRecords&metadataPrefix=oai_marcxml_cpk&set=CPK";
        var client = new HttpClient();
        var stopwatch = Stopwatch.StartNew();
        var channel = Channel.CreateUnbounded<XDocument>();
        var records = new ConcurrentBag<BookRecord>();

        int i = 0;
        int totalBooks = 0;
        string folder = "harvested_xml";
        Directory.CreateDirectory(folder);

        // Producer
        _ = Task.Run(async () =>
        {
            Stopwatch stopwatch = Stopwatch.StartNew();
            string requestUrl = baseUrl;

            while (!string.IsNullOrEmpty(requestUrl))
            {
                using var response = await client.GetAsync(requestUrl);
                using var stream = await response.Content.ReadAsStreamAsync();

                // Detect encoding from headers if present
                var charset = response.Content.Headers.ContentType?.CharSet;
                Encoding encoding = !string.IsNullOrEmpty(charset) ? Encoding.GetEncoding(charset) : Encoding.UTF8;

                using var reader = new StreamReader(stream, encoding, detectEncodingFromByteOrderMarks: true);
                var doc = XDocument.Load(reader);

                // Save XML batch file
                string fileName = Path.Combine(folder, $"batch_{i:D6}.xml");
                File.WriteAllText(fileName, doc.ToString());

                // Send to consumers
                await channel.Writer.WriteAsync(doc);

                // Handle resumption token
                var token = doc.Descendants(XName.Get("resumptionToken", "http://www.openarchives.org/OAI/2.0/"))
                               .FirstOrDefault();

                requestUrl = token != null && !string.IsNullOrWhiteSpace(token.Value)
                    ? $"https://ipac.kvkli.cz/arl-li/cs/oai/?verb=ListRecords&resumptionToken={token.Value}"
                    : null;

                if (i % 1000 == 0)
                {
                    Console.WriteLine($"Fetched {i} requests so far...");
                    Console.WriteLine($"Elapsed time: {stopwatch.Elapsed}");
                }

                i++;
            }

            channel.Writer.Complete();
            Console.WriteLine($"Finished fetching {i} batches.");
            Console.WriteLine($"Total time: {stopwatch.Elapsed}");
        });

        // Consumers
        var parserTasks = Enumerable.Range(0, Environment.ProcessorCount).Select(async _ =>
        {
            using var writer = new StreamWriter("booksFR.csv", false, Encoding.UTF8);
            writer.WriteLine("Title,Author,Publisher,Year,ISBN,Subjects,Description");

            await foreach (var doc in channel.Reader.ReadAllAsync())
            {
                foreach (var rec in doc.Descendants(XName.Get("record", "http://www.openarchives.org/OAI/2.0/")))
                {
                    var book = ParseMarcXml(rec);
                    if (book != null)
                    {
                        string line = $"\"{book.Title}\",\"{book.Author}\",\"{book.Publisher}\",\"{book.Year}\",\"{book.ISBN}\",\"{book.Subjects}\",\"{book.Description}\"";
                        await writer.WriteLineAsync(line);
                    }
                }
            }
        }).ToArray();

        await Task.WhenAll(parserTasks);

        Console.WriteLine("\nSample harvested records:");
        foreach (var r in records.Take(5)) // show first few
        {
            Console.WriteLine($"{r.Title} / {r.Author} ({r.Year})");
        }
    }

    static BookRecord ParseMarcXml(XElement record)
    {
        XNamespace marcNs = "http://www.loc.gov/MARC21/slim";
        var marc = record.Descendants(marcNs + "record").FirstOrDefault();
        if (marc == null) return null;

        string title = GetSubfield(marc, "245", "a");
        string author = GetSubfield(marc, "100", "a");
        string publisher = GetSubfield(marc, "260", "b");
        string year = GetSubfield(marc, "260", "c");
        string isbn = GetSubfield(marc, "020", "a");
        string subjects = string.Join("; ", GetSubfields(marc, "650", "a"));
        string description = GetSubfield(marc, "520", "a");

        return new BookRecord
        {
            Title = title,
            Author = author,
            Publisher = publisher,
            Year = year,
            ISBN = isbn,
            Subjects = subjects,
            Description = description
        };
    }

    static string GetSubfield(XElement record, string tag, string code) =>
        record.Elements().Where(e => e.Name.LocalName == "datafield" && e.Attribute("tag")?.Value == tag)
            .Elements().Where(sf => sf.Name.LocalName == "subfield" && sf.Attribute("code")?.Value == code)
            .Select(sf => sf.Value).FirstOrDefault();

    static IEnumerable<string> GetSubfields(XElement record, string tag, string code) =>
        record.Elements().Where(e => e.Name.LocalName == "datafield" && e.Attribute("tag")?.Value == tag)
            .Elements().Where(sf => sf.Name.LocalName == "subfield" && sf.Attribute("code")?.Value == code)
            .Select(sf => sf.Value);

    class BookRecord
    {
        public string Title { get; set; }
        public string Author { get; set; }
        public string Publisher { get; set; }
        public string Year { get; set; }
        public string ISBN { get; set; }
        public string Subjects { get; set; }
        public string Description { get; set; }
    }
}
