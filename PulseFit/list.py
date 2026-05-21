from pathlib import Path

import streamlit as st
import streamlit.components.v1 as components


st.set_page_config(page_title="PulseFit", page_icon="PF", layout="wide", initial_sidebar_state="collapsed")

BASE_DIR = Path(__file__).resolve().parent
html = (BASE_DIR / "index.html").read_text(encoding="utf-8")
css = (BASE_DIR / "styles.css").read_text(encoding="utf-8")
js = (BASE_DIR / "app.js").read_text(encoding="utf-8")

html = html.replace('<link rel="stylesheet" href="styles.css">', f"<style>{css}</style>")
html = html.replace('<script src="app.js"></script>', f"<script>{js}</script>")

st.markdown(
    """
    <style>
    #MainMenu, header, footer { display: none !important; }
    .stApp { background: #020617; }
    .block-container { padding: 0 !important; max-width: 100% !important; }
    iframe { display: block; }
    </style>
    """,
    unsafe_allow_html=True,
)

components.html(html, height=980, scrolling=True)
