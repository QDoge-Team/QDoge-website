'use client'
import Link from 'next/link';
import React from 'react';
import styled from 'styled-components';

const Card = ({ background, link, name, desc, onClick }: any) => {
    return (
        <StyledWrapper suppressHydrationWarning>
            <Link href={link} onClick={onClick}>
                <div className={`container noselect`}>
                    <div className={`canvas`}>
                        <div className="tracker tr-1" />
                        <div className="tracker tr-2" />
                        <div className="tracker tr-3" />
                        <div className="tracker tr-4" />
                        <div className="tracker tr-5" />
                        <div className="tracker tr-6" />
                        <div className="tracker tr-7" />
                        <div className="tracker tr-8" />
                        <div className="tracker tr-9" />
                        <div id="card" className={``}>
                            <div className={`card-content bg-${background} bg-center bg-cover`}>
                                <div className="card-glare" />
                                <div className="cyber-lines">
                                    <span /><span /><span /><span />
                                </div>
                                <p id="prompt" className='text-2xl font-mono'>{name}</p>
                                <div className="title font-mono">Enter<br />{name}</div>
                                <div className="glowing-elements">
                                    <div className="glow-1" />
                                    <div className="glow-2" />
                                    <div className="glow-3" />
                                </div>
                                <div className="subtitle font-mono">
                                    <span className="highlight">{desc}</span>
                                </div>
                                <div className="card-particles">
                                    <span /><span /><span /><span /><span /><span />
                                </div>
                                <div className="corner-elements">
                                    <span /><span /><span /><span />
                                </div>
                                <div className="scan-line" />
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </StyledWrapper>
    );
}

const StyledWrapper = styled.div`
  .container {
    position: relative;
    width: 254px;
    height: 198px;
    transition: 200ms;
  }

  .container:active {
    width: 245px;
    height: 180px;
  }

  #card {
    position: absolute;
    inset: 0;
    z-index: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 16px;
    transition: 700ms;
    background: linear-gradient(135deg, rgba(0,0,0,0.9), rgba(10,10,10,0.95));
    border: 1px solid rgba(0, 243, 255, 0.15);
    overflow: hidden;
    box-shadow:
      0 0 20px rgba(0, 0, 0, 0.5),
      0 0 1px rgba(0, 243, 255, 0.2),
      inset 0 0 30px rgba(0, 0, 0, 0.3);
  }

  .card-content {
    position: relative;
    width: 100%;
    height: 100%;
  }

  #prompt {
    bottom: 90px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 20;
    font-weight: 700;
    letter-spacing: 4px;
    transition: 300ms ease-in-out;
    position: absolute;
    text-align: center;
    color: #00f3ff;
    text-shadow: 0 0 20px rgba(0, 243, 255, 0.4), 0 0 40px rgba(0, 243, 255, 0.1);
    text-transform: uppercase;
  }

  .title {
    opacity: 0;
    transition: 300ms ease-in-out;
    position: absolute;
    font-size: 24px;
    font-weight: 800;
    letter-spacing: 6px;
    text-align: center;
    width: 100%;
    padding-top: 20px;
    text-transform: uppercase;
    background: linear-gradient(135deg, #00f3ff, #bc13fe);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 0 15px rgba(0, 243, 255, 0.3));
  }

  .subtitle {
    position: absolute;
    bottom: 40px;
    width: 100%;
    text-align: center;
    font-size: 10px;
    letter-spacing: 3px;
    transform: translateY(30px);
    color: rgba(255, 255, 255, 0.4);
    text-transform: uppercase;
  }

  .highlight {
    background: linear-gradient(90deg, #00f3ff, #bc13fe);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: bold;
  }

  .glowing-elements {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .glow-1,
  .glow-2,
  .glow-3 {
    position: absolute;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: radial-gradient(
      circle at center,
      rgba(0, 243, 255, 0.2) 0%,
      rgba(0, 243, 255, 0) 70%
    );
    filter: blur(15px);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .glow-1 { top: -20px; left: -20px; }
  .glow-2 { top: 50%; right: -30px; transform: translateY(-50%); background: radial-gradient(circle at center, rgba(188, 19, 254, 0.2) 0%, transparent 70%); }
  .glow-3 { bottom: -20px; left: 30%; }

  .card-particles span {
    position: absolute;
    width: 2px;
    height: 2px;
    background: #00f3ff;
    border-radius: 50%;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .tracker:hover ~ #card .title { opacity: 1; transform: translateY(-10px); }
  .tracker:hover ~ #card .glowing-elements div { opacity: 1; }
  .tracker:hover ~ #card .card-particles span { animation: particleFloat 2s infinite; }

  @keyframes particleFloat {
    0% { transform: translate(0, 0); opacity: 0; }
    50% { opacity: 0.8; }
    100% { transform: translate(calc(var(--x, 0) * 30px), calc(var(--y, 0) * 30px)); opacity: 0; }
  }

  .card-particles span:nth-child(1) { --x: 1; --y: -1; top: 40%; left: 20%; }
  .card-particles span:nth-child(2) { --x: -1; --y: -1; top: 60%; right: 20%; }
  .card-particles span:nth-child(3) { --x: 0.5; --y: 1; top: 20%; left: 40%; }
  .card-particles span:nth-child(4) { --x: -0.5; --y: 1; top: 80%; right: 40%; }
  .card-particles span:nth-child(5) { --x: 1; --y: 0.5; top: 30%; left: 60%; }
  .card-particles span:nth-child(6) { --x: -1; --y: 0.5; top: 70%; right: 60%; }

  #card::before {
    content: "";
    background: radial-gradient(
      circle at center,
      rgba(0, 243, 255, 0.1) 0%,
      rgba(188, 19, 254, 0.05) 50%,
      transparent 100%
    );
    filter: blur(20px);
    opacity: 0;
    width: 150%;
    height: 150%;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    transition: opacity 0.3s ease;
  }

  .tracker:hover ~ #card::before { opacity: 1; }

  .tracker {
    position: absolute;
    z-index: 200;
    width: 100%;
    height: 100%;
  }

  .tracker:hover { cursor: pointer; }
  .tracker:hover ~ #card #prompt { opacity: 0; }

  .tracker:hover ~ #card {
    transition: 300ms;
    filter: brightness(1.15);
    border-color: rgba(0, 243, 255, 0.4);
    box-shadow: 0 0 30px rgba(0, 243, 255, 0.15), 0 0 1px rgba(0, 243, 255, 0.5);
  }

  .container:hover #card::before {
    transition: 200ms;
    opacity: 80%;
  }

  .canvas {
    perspective: 800px;
    inset: 0;
    z-index: 200;
    position: absolute;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
    grid-template-rows: 1fr 1fr 1fr 1fr 1fr;
    gap: 0px 0px;
    grid-template-areas:
      "tr-1 tr-2 tr-3 tr-4 tr-5"
      "tr-6 tr-7 tr-8 tr-9 tr-10"
      "tr-11 tr-12 tr-13 tr-14 tr-15"
      "tr-16 tr-17 tr-18 tr-19 tr-20"
      "tr-21 tr-22 tr-23 tr-24 tr-25";
  }

  .tr-1 { grid-area: tr-1; }
  .tr-2 { grid-area: tr-2; }
  .tr-3 { grid-area: tr-3; }
  .tr-4 { grid-area: tr-4; }
  .tr-5 { grid-area: tr-5; }
  .tr-6 { grid-area: tr-6; }
  .tr-7 { grid-area: tr-7; }
  .tr-8 { grid-area: tr-8; }
  .tr-9 { grid-area: tr-9; }

  .tr-1:hover ~ #card { transition: 125ms ease-in-out; transform: rotateX(20deg) rotateY(-10deg); }
  .tr-2:hover ~ #card { transition: 125ms ease-in-out; transform: rotateX(20deg) rotateY(-5deg); }
  .tr-3:hover ~ #card { transition: 125ms ease-in-out; transform: rotateX(20deg) rotateY(0deg); }
  .tr-4:hover ~ #card { transition: 125ms ease-in-out; transform: rotateX(20deg) rotateY(5deg); }
  .tr-5:hover ~ #card { transition: 125ms ease-in-out; transform: rotateX(20deg) rotateY(10deg); }
  .tr-6:hover ~ #card { transition: 125ms ease-in-out; transform: rotateX(10deg) rotateY(-10deg); }
  .tr-7:hover ~ #card { transition: 125ms ease-in-out; transform: rotateX(10deg) rotateY(-5deg); }
  .tr-8:hover ~ #card { transition: 125ms ease-in-out; transform: rotateX(10deg) rotateY(0deg); }
  .tr-9:hover ~ #card { transition: 125ms ease-in-out; transform: rotateX(10deg) rotateY(5deg); }

  .noselect {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  .card-glare {
    position: absolute;
    inset: 0;
    background: linear-gradient(125deg, rgba(255,255,255,0) 0%, rgba(0,243,255,0.03) 45%, rgba(0,243,255,0.08) 50%, rgba(0,243,255,0.03) 55%, rgba(255,255,255,0) 100%);
    opacity: 0;
    transition: opacity 300ms;
  }

  .cyber-lines span {
    position: absolute;
    background: linear-gradient(90deg, transparent, rgba(0, 243, 255, 0.15), transparent);
  }

  .cyber-lines span:nth-child(1) { top: 20%; left: 0; width: 100%; height: 1px; transform: scaleX(0); transform-origin: left; animation: lineGrow 3s linear infinite; }
  .cyber-lines span:nth-child(2) { top: 40%; right: 0; width: 100%; height: 1px; transform: scaleX(0); transform-origin: right; animation: lineGrow 3s linear infinite 1s; }
  .cyber-lines span:nth-child(3) { top: 60%; left: 0; width: 100%; height: 1px; transform: scaleX(0); transform-origin: left; animation: lineGrow 3s linear infinite 2s; }
  .cyber-lines span:nth-child(4) { top: 80%; right: 0; width: 100%; height: 1px; transform: scaleX(0); transform-origin: right; animation: lineGrow 3s linear infinite 1.5s; }

  .corner-elements span {
    position: absolute;
    width: 12px;
    height: 12px;
    border: 1px solid rgba(0, 243, 255, 0.25);
    transition: all 0.3s ease;
  }

  .corner-elements span:nth-child(1) { top: 8px; left: 8px; border-right: 0; border-bottom: 0; }
  .corner-elements span:nth-child(2) { top: 8px; right: 8px; border-left: 0; border-bottom: 0; }
  .corner-elements span:nth-child(3) { bottom: 8px; left: 8px; border-right: 0; border-top: 0; }
  .corner-elements span:nth-child(4) { bottom: 8px; right: 8px; border-left: 0; border-top: 0; }

  .scan-line {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, transparent, rgba(0, 243, 255, 0.06), transparent);
    transform: translateY(-100%);
    animation: scanMove 3s linear infinite;
  }

  @keyframes lineGrow {
    0% { transform: scaleX(0); opacity: 0; }
    50% { transform: scaleX(1); opacity: 1; }
    100% { transform: scaleX(0); opacity: 0; }
  }

  @keyframes scanMove {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100%); }
  }

  #card:hover .card-glare { opacity: 1; }

  #card:hover .corner-elements span {
    border-color: rgba(0, 243, 255, 0.6);
    box-shadow: 0 0 8px rgba(0, 243, 255, 0.3);
  }
`;

export default Card;
