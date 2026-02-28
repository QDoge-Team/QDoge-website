import axiosServices from "@/util/axios";
import { useCallback, useEffect, useState } from "react";
import Modal from "./Modal";


const GameHistory = ({ Label, setGameId }: any) => {
    const [openModal, setOpenModal] = useState(false)
    const [histories, setHistory] = useState([])
    const [loading, setLoading] = useState(false);
    const [skip, setSkip] = useState(0);

    // get game hash
    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const { data } = await axiosServices.get(`/${Label}/games`, {
                params: {
                    skip,
                    limit: 7
                }
            })
            setHistory(data)
            setOpenModal(true)
        } catch (error) {
            // toast.error("Request failed")
        }
        setLoading(false)
    }, [skip])

    const setVeifyGameId = (gameid: string) => {
        setGameId(gameid)
    }

    useEffect(() => {
        if (histories.length > 0) {
            fetchData()
        }
    }, [skip])

    useEffect(() => {
        if (openModal) {
            fetchData()
        }
    }, [openModal])

    return <>
        {Label === "crash" ?
            <div onClick={() => setOpenModal(true)} className="w-9 px-2 cursor-pointer mt-1">
                <div className="w-8 h-5 text-cyan-400 hover:text-cyan-300 transition-colors">
                    📋
                </div>
            </div> :
            <button onClick={() => setOpenModal(true)}
                className="p-1 rounded-md text-[11px] font-mono transition active:scale-90 transform min-w-7 bg-cyan-400/15 text-cyan-400 border border-cyan-400/20 hover:bg-cyan-400/25" >
                📋
            </button>}
        <Modal isOpen={openModal} onClose={() => { setOpenModal(false) }} className="animate-zoomIn bg-black/95 backdrop-blur-xl max-w-[530px] w-svw rounded-xl border border-cyan-400/20">
            <div className="p-4 border-b border-cyan-400/10">
                <div className="flex uppercase font-mono text-cyan-400 text-sm tracking-widest">
                    ▸ {Label} Game History
                </div>
            </div>
            <div className="relative bg-black/60">
                <div className="flex flex-col">
                    <div>
                        <div className="flex-col">
                            <div className="flex text-[10px] font-mono text-gray-500 tracking-widest uppercase px-3 py-2 border-b border-cyan-400/10">
                                <div className="flex-1">Time</div>
                                <div className="flex-1 text-center">Multiplier</div>
                                <div className="flex-1 text-right">Details</div>
                            </div>
                            <div className="min-h-[500px] relative">
                                {loading && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                    <div className="flex space-x-2">
                                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce delay-200"></div>
                                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce delay-400"></div>
                                    </div>
                                </div>}
                                {
                                    histories.map((game: any, key) => (
                                        <div className="flex justify-between items-center px-3 py-2 border-b border-cyan-400/5 hover:bg-cyan-400/5 transition-colors" key={key} >
                                            <div className="p-0 flex-1">
                                                <div className="flex items-center text-xs font-mono text-gray-400">
                                                    <span className="ml-1">
                                                        {/* {moment(game.startedAt).format("h:m A D/M/YYYY")} */}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="p-0 flex-1 text-center">
                                                {game.crashPoint < 1.2 ? (
                                                    <span className="text-red-400 font-mono text-sm">{parseCommasToThousands(
                                                        cutDecimalPoints(game.crashPoint.toFixed(2))
                                                    )}x</span>
                                                ) : game.crashPoint >= 1.2 && game.crashPoint < 2 ? (
                                                    <span className="text-yellow-400 font-mono text-sm">{parseCommasToThousands(
                                                        cutDecimalPoints(game.crashPoint.toFixed(2))
                                                    )}x</span>
                                                ) : game.crashPoint >= 2 && game.crashPoint < 100 ? (
                                                    <span className="text-cyan-400 font-mono text-sm">{parseCommasToThousands(
                                                        cutDecimalPoints(game.crashPoint.toFixed(2))
                                                    )}x</span>
                                                ) : (
                                                    <span className="text-purple-400 font-mono text-sm">{parseCommasToThousands(
                                                        cutDecimalPoints(game.crashPoint.toFixed(2))
                                                    )}x</span>
                                                )}
                                            </div>
                                            <div className="p-0 flex-1 text-right">
                                                <button 
                                                    className="text-xs font-mono text-cyan-400/60 hover:text-cyan-400 border border-cyan-400/20 hover:border-cyan-400/40 px-2 py-1 rounded transition-colors"
                                                    onClick={() => {
                                                        setOpenModal(false);
                                                        setVeifyGameId(game._id)
                                                    }}
                                                >
                                                    View
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                        <div className="flex justify-center items-center gap-2 p-3 border-t border-cyan-400/10">
                            <button 
                                className="text-xs font-mono text-gray-400 hover:text-cyan-400 border border-cyan-400/15 hover:border-cyan-400/30 px-3 py-1.5 rounded transition-colors"
                                onClick={() => skip > 0 && setSkip(skip - 1)}
                            >
                                ◂ Prev
                            </button>
                            <button 
                                className="text-xs font-mono text-gray-400 hover:text-cyan-400 border border-cyan-400/15 hover:border-cyan-400/30 px-3 py-1.5 rounded transition-colors"
                                onClick={() => setSkip(skip + 1)}
                            >
                                Next ▸
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    </>
}

export default GameHistory;

const parseCommasToThousands = (value: string) =>
    value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const cutDecimalPoints = (num: any) =>
    num.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0];
