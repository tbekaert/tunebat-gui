import React from 'react';

import { ipcRenderer } from 'electron';

import { File, Suggestion, ApiSuggestionSchema } from '../types';

const Queue: React.FunctionComponent = () => {
  const [queue, setQueue] = React.useState<File[]>([]);
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);

  const currentFile = React.useMemo(() => queue[0] ?? false, [queue]);

  const [status, setStatus] = React.useState<'loading' | 'idle' | 'error'>(
    'loading'
  );

  const chooseFiles = async () => {
    try {
      const { filePaths } = (await ipcRenderer.invoke('open-file-dialog')) as {
        cancelled: boolean;
        filePaths: string[];
      };
      setQueue((existingFiles) =>
        existingFiles.concat(
          filePaths
            .map((path) => ({
              name: (path.split('/').pop() || '').replace(/\.[^/.]+$/, ''),
              extension: path.split('.').pop() || '',
              path,
            }))
            .filter(
              (file) =>
                !existingFiles.some(
                  (existingFile) => existingFile.path === file.path
                )
            )
        )
      );
    } catch (error) {
      console.error(error);
    }
  };

  const removeFile = () => {
    if (currentFile) {
      setQueue((existingFiles) =>
        existingFiles.filter(
          (existingFile) => existingFile.path !== currentFile.path
        )
      );
    }
  };

  const loadSuggestions = (file: File) => {
    setStatus('loading');

    (ipcRenderer.invoke('scrap-html', file.name) as Promise<string>)
      .then((html) => {
        // console.log(html);

        const apiResults =
          JSON.parse(
            html
              .match(/\{"serverModelJSONstring":"(?<json>.*)","redux/)
              ?.groups?.json?.replace(/\\u0022/g, '"') ?? ''
          )?.searchResult?.items ?? [];

        console.log(apiResults);

        const result = ApiSuggestionSchema.safeParse(apiResults);

        if (!result.success) {
          console.error(result.error);
          setStatus('error');
        } else {
          console.log(result.data);
          setSuggestions(
            result.data.map(
              (item) =>
                ({
                  id: item.id ?? '',
                  artist: item.as[0],
                  title: item.n ?? '',
                  img: item.im[0] ?? '',
                  bpm: String(item.b) ?? '',
                  camelot: item.c ?? '',
                  key: item.k ?? '',
                } as Suggestion)
            )
          );
          setStatus('idle');
        }
        return null;
      })
      .catch((err) => {
        console.error(err);
        setStatus('error');
      });
  };

  const renameFile = (suggestion: Suggestion) => () => {
    if (currentFile) {
      console.log(currentFile, suggestion);
      const newName = [
        suggestion.camelot.padStart(3, '0'),
        '|',
        suggestion.bpm.padStart(3, '0'),
        '>',
        suggestion.artist,
        '-',
        suggestion.title,
      ].join(' ');

      ipcRenderer
        .invoke(
          'rename-file',
          currentFile.path,
          currentFile.path.replace(currentFile.name, newName)
        )
        .then(() => {
          removeFile();
          return null;
        })
        .catch((err) => {
          console.error(err);
        });
    }
  };

  React.useEffect(() => {
    if (currentFile) {
      loadSuggestions(currentFile);
    } else {
      setStatus('loading');
    }
  }, [currentFile]);

  if (!currentFile) {
    return (
      <div className="w-screen h-screen flex justify-center items-center">
        <button
          type="button"
          onClick={chooseFiles}
          className="mx-2 rounded px-5 py-3 border-2 hover:bg-transparent text-white transition-colors border-indigo-700 bg-indigo-700"
        >
          Add files to analyse
        </button>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col justify-between items-center">
      <div className="w-screen p-5 bg-gray-800 flex flex-none justify-between items-center">
        <h2 className="text-xl text-white">
          <span className="text-gray-500">File:</span> {currentFile.name}.
          {currentFile.extension}
        </h2>
        <button
          type="button"
          onClick={removeFile}
          className="rounded px-2 py-1 text-xs rounded px-1 border-2 border-red-700 bg-transparent hover:bg-red-700 text-red-700 hover:text-white transition-colors"
        >
          SKIP
        </button>
      </div>
      <div className="w-screen p-5 flex-col flex flex-grow overflow-scroll">
        <div className="bg-white shadow overflow-hidden border-b border-gray-200 rounded divide-y divide-gray-200 flex flex-col">
          <div className="flex bg-gray-50">
            <div className="w-7/12 pl-4 py-4 text-left text-xs font-medium text-gray-500 uppercase">
              Song
            </div>
            <div className="w-1/12 py-4 text-center text-xs font-medium text-gray-500 uppercase">
              BPM
            </div>
            <div className="w-1/12 py-4 text-center text-xs font-medium text-gray-500 uppercase">
              Camelot
            </div>
            <div className="w-1/12 py-4 text-center text-xs font-medium text-gray-500 uppercase">
              Key
            </div>
            <div className="w-2/12 py-4 text-left text-xs font-medium text-gray-500 uppercase">
              &nbsp;
            </div>
          </div>
          <div className="flex flex-col flex-grow flex-shrink divide-y divide-gray-200 overflow-scroll">
            {
              {
                loading: (
                  <div className="py-5 m-auto text-xl font-medium text-gray-900 text-center">
                    Loading...
                  </div>
                ),
                error: (
                  <div className="py-5 flex flex-col justify-center items-center">
                    <div className="text-xl font-medium text-red-600 text-center mb-4">
                      Error while loading suggestions
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        loadSuggestions(currentFile);
                      }}
                      className="rounded px-2 py-1 text-xs rounded px-1 border-2 border-red-700 bg-transparent hover:bg-red-700 text-red-700 hover:text-white transition-colors"
                    >
                      RETRY
                    </button>
                  </div>
                ),
                idle: (
                  <>
                    {suggestions.map((suggestion) => (
                      <div key={suggestion.id} className="flex">
                        <div className="w-7/12 px-4 py-4 flex items-center">
                          {suggestion.img ? (
                            <img
                              src={suggestion.img}
                              alt={suggestion.title}
                              className="w-20 h-20 rounded"
                            />
                          ) : (
                            <div className="flex justify-center items-center flex-shrink-0 w-20 h-20 rounded bg-gray-300 text-4xl font-black text-gray-400">
                              ?
                            </div>
                          )}
                          <div className="ml-4 flex flex-col">
                            <div className="text-gray-600 text-sm leading-none mb-1">
                              {suggestion.artist}
                            </div>
                            <div className="text-gray-900">
                              {suggestion.title}
                            </div>
                          </div>
                        </div>
                        <div className="w-1/12 py-4 flex flex-col justify-center items-center">
                          <span className="inline-flex text-lg font-semibold">
                            {suggestion.bpm}
                          </span>
                        </div>
                        <div className="w-1/12 py-4 flex flex-col justify-center items-center">
                          <span className="inline-flex text-lg font-semibold">
                            {suggestion.camelot}
                          </span>
                        </div>
                        <div className="w-1/12 py-4 flex flex-col justify-center items-center">
                          <span className="inline-flex text-lg font-semibold">
                            {suggestion.key}
                          </span>
                        </div>
                        <div className="w-2/12 pr-4 py-4 flex flex-col justify-center items-end whitespace-nowrap">
                          <button
                            type="button"
                            onClick={renameFile(suggestion)}
                            className="rounded px-2 py-1 text-xs rounded px-1 border-2 border-green-700 bg-transparent hover:bg-green-700 text-green-700 hover:text-white transition-colors"
                          >
                            select
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                ),
              }[status]
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default Queue;
