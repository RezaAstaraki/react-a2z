
import React, { useState } from "react";

export default function ClientLogger({
  data,
  label,
  showDataInUi = false,
  showDataConsole = false,
  indent = 4, // Default indent is 4 spaces, but it can be set as a prop
}: {
  data: any;
  label?: string;
  showDataInUi?: boolean;
  showDataConsole?: boolean;
  indent?: number;
}) {
  const [showData, setShowData] = useState(showDataInUi);
  const [showDataC, setShowDataC] = useState(showDataConsole);
  const [show, setShow] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const copyAllToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, indent));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1000);
  };

  const [copiedAll, setCopiedAll] = useState(false);
  // const [remove, setRemove] = useState(false)

  return (

    <>

      {show &&
        <div className="client-logger bg-white text-sm p-4 border rounded" dir="ltr">
          {show && (
            <div className="flex justify-between items-center mb-3">
              <h1 className="font-bold">Client Logger{label && ` - ${label}`}</h1>
              <div className="flex gap-3">
                <label>
                  <input
                    type="checkbox"
                    checked={showData}
                    onChange={(e) => { setShowData(e.target.checked); }}
                  />
                  Show Data in UI
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={showDataC}
                    onChange={(e) => { setShowDataC(e.target.checked); console.log(data); }}
                  />
                  Show Data in Console
                </label>
              </div>
              <button
                className="close-button"
                onClick={() => setShow(false)}
                style={{
                  cursor: "pointer",
                  background: "none",
                  border: "none",
                  fontSize: "16px",
                }}
              >
                &times;
              </button>
            </div>
          )}

          {showData && (
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto max-w-[80vw] max-h-[50vh]">
              <div className="mb-3">
                <button
                  onClick={copyAllToClipboard}
                  className="copy-all-button bg-gray-300 px-3 py-1 rounded-md text-sm text-black"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    cursor: "pointer",
                    padding: "5px 10px",
                    borderRadius: "5px",
                  }}
                >
                  {copiedAll ? "✔ Copied All" : "Copy All"}
                </button>
              </div>
              <JsonViewer
                data={data}
                indent={indent}
                searchTerm={searchTerm}
                showInConsole={showDataC}
              />
            </pre>
          )}
        </div>
      }
    </>
  );
}

function JsonViewer({
  data,
  indent,
  searchTerm,
  showInConsole,
}: {
  data: any;
  indent: number;
  searchTerm: string;
  showInConsole: boolean;
}) {
  if (typeof data === "object" && data !== null) {
    return <JsonNode data={data} level={0} indent={indent} searchTerm={searchTerm} showInConsole={showInConsole} />;
  }
  return <span className="text-blue-500">{JSON.stringify(data, null, indent)}</span>;
}

function JsonNode({
  data,
  level,
  indent,
  searchTerm,
  showInConsole,
}: {
  data: any;
  level: number;
  indent: number;
  searchTerm: string;
  showInConsole: boolean;
}) {
  const [collapsed, setCollapsed] = useState<{ [key: string]: boolean }>({});
  const [listCollapsed, setListCollapsed] = useState(false);
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({});

  const copyToClipboard = (value: any, key: string) => {
    navigator.clipboard.writeText(JSON.stringify(value, null, indent));
    setCopied((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => setCopied((prev) => ({ ...prev, [key]: false })), 1000);
  };

  if (typeof data !== "object" || data === null) {
    return <span className="text-blue-500">{JSON.stringify(data)}</span>;
  }

  const isArray = Array.isArray(data);
  const openingBracket = isArray ? "[" : "{";
  const closingBracket = isArray ? "]" : "}";

  const handleCollapseList = () => {
    setListCollapsed((prev) => !prev);
  };

  return (
    <div className="json-node pl-4">
      <span className="block flex items-center">
        <span>{openingBracket}</span>
        {isArray && (
          <button
            onClick={handleCollapseList}
            className="collapse-list-button bg-gray-200 py-1 px-2 rounded-md text-sm text-black ml-2"
            style={{
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {listCollapsed ? "Expand All" : "Collapse All"}
          </button>
        )}
      </span>

      {Object.entries(data)
        .filter(([key]) => showInConsole || key.toLowerCase().includes(searchTerm.toLowerCase())) // Exclude search in console view
        .map(([key, value], index, array) => {
          const isObject = typeof value === "object" && value !== null;
          return (
            <div key={key} className="ml-4 flex items-start">
              {isObject && (
                <button
                  onClick={() => setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }))}
                  style={{
                    width: "20px",
                    height: "20px",
                    marginRight: "10px",
                    backgroundColor: "#e0e0e0",
                    color: "black",
                    fontSize: "12px",
                    fontWeight: "bold",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  {collapsed[key] ? "+" : "-"}
                </button>
              )}
              <div className="flex items-center">
                {!isArray && <span className="text-green-700">"{key}": </span>}
                {!isObject ? (
                  <span className="text-blue-500 ml-1">{JSON.stringify(value)}</span>
                ) : null}
              </div>

              <button
                onClick={() => copyToClipboard(isObject ? value : JSON.stringify(value), key)}
                className="ml-2"
                style={{
                  fontSize: "14px",
                  color: "#666",
                  cursor: "pointer",
                }}
              >
                {copied[key] ? (
                  <span className="text-green-500">✔</span>
                ) : (
                  <span className="text-black">📋</span>
                )}
              </button>

              {isObject && !collapsed[key] && (
                <JsonNode data={value} level={level + 1} indent={indent} searchTerm={searchTerm} showInConsole={showInConsole} />
              )}

              {index < array.length - 1 && ","}
            </div>
          );
        })}
      <span className="block">{closingBracket}</span>
    </div>
  );
}
