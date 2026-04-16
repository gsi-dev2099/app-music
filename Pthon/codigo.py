import tkinter as tk
import winsound
import os

# --- CONFIGURACIÓN DE TIEMPOS (en milisegundos) ---
tiempos = [
    15000, # <-- Cambiado de 3500 a 15000 (15 segundos)
    3500, 2000, 9000, 3000, 3500, 2500, 6000, 6000, 3000, 
    5500, 5000, 5500, 6000, 5500, 6500, 2500, 3500, 2500, 9500,
    2000, 4000, 2000, 6000, 5000, 4000, 5000, 5500, 6000, 5500,
    6500, 3000, 28000, 3000, 3000, 2500, 4000, 5000, 6000, 5500,
    8000
]

frases = [
    "I walk a lonely road",
    "The only one that I have ever known",
    "Don't know where it goes",
    "But it's home to me, and I walk alone",
    "I walk this empty street",
    "On the boulevard of broken dreams",
    "Where the city sleeps",
    "And I'm the only one, and I walk alone",
    "I walk alone, I walk alone",
    "I walk alone, I walk a-",
    "My shadow's the only one that walks beside me",
    "My shallow heart's the only thing that's beating",
    "Sometimes I wish someone out there will find me",
    "'Til then, I walk alone",
    "Ah, ah, ah, ah",
    "Ah, ah, ah",
    "I'm walking down the line",
    "That divides me somewhere in my mind",
    "On the borderline",
    "Of the edge and where I walk alone",
    "Read between the lines",
    "What's fucked up, and everything's all right",
    "Check my vital signs",
    "To know I'm still alive, and I walk alone",
    "I walk alone, I walk alone",
    "I walk alone, I walk a-",
    "My shadow's the only one that walks beside me",
    "My shallow heart's the only thing that's beating",
    "Sometimes I wish someone out there will find me",
    "'Til then, I walk alone",
    "Ah, ah, ah, ah",
    "Ah, ah",
    "I walk alone, I walk a-",
    "I walk this empty street",
    "On the boulevard of broken dreams",
    "Where the city sleeps",
    "And I'm the only one, and I walk a-",
    "My shadow's the only one that walks beside me",
    "My shallow heart's the only thing that's beating",
    "Sometimes I wish someone out there will find me",
    "'Til then, I walk alone"
]

indice = 1 

def reproducir_musica():
    try:
        # Obtenemos la ruta absoluta de la carpeta donde está el script
        base_path = os.path.dirname(os.path.abspath(__file__))
        musica_path = os.path.join(base_path, "musica.wav")
        
        if os.path.exists(musica_path):
            winsound.PlaySound(musica_path, winsound.SND_FILENAME | winsound.SND_ASYNC)
        else:
            print(f"Error: No se encontró el archivo en {musica_path}")
    except Exception as e:
        print(f"Error al reproducir música: {e}")

def actualizar_letra():
    global indice
    if indice < len(frases):
        label.config(text=frases[indice])
        # Efecto de fade-in simple (cambiando color si quisiéramos, pero Tkinter es limitado)
        duracion = tiempos[indice] if indice < len(tiempos) else 3000
        indice += 1
        ventana.after(duracion, actualizar_letra)
    else:
        # Efecto final
        label.config(text="... I walk alone ...", fg="#555555")
        ventana.after(5000, ventana.destroy)

# --- VENTANA ---
ventana = tk.Tk()
ventana.title("Boulevard of Broken Dreams 🎸")
ventana.geometry("500x300")
ventana.configure(bg="#0f0f12") # Dark background

# Intentamos centrar la ventana
ventana.eval('tk::PlaceWindow . center')

# Frame principal con bordes redondeados (simulado con relieve)
frame = tk.Frame(ventana, bg="#1a1a24", bd=0, highlightthickness=1, highlightbackground="#33334d")
frame.place(relx=0.5, rely=0.5, anchor="center", width=420, height=220)

# Título pequeño de la canción
cancion_label = tk.Label(
    frame,
    text="GREEN DAY - BOULEVARD OF BROKEN DREAMS",
    font=("Segoe UI", 8, "bold"),
    bg="#1a1a24",
    fg="#666680"
)
cancion_label.pack(pady=(20,0))

# Letra principal
label = tk.Label(
    frame,
    text=frases[0], 
    font=("Segoe UI", 16, "italic"),
    bg="#1a1a24",
    fg="#bb86fc", # Accent color (Purple)
    wraplength=380,
    justify="center"
)
label.pack(expand=True, padx=20, pady=20)

# Pequeño decorador inferior
decor = tk.Label(frame, text="🎸", bg="#1a1a24", fg="#33334d", font=("Arial", 20))
decor.pack(pady=(0, 10))

# Iniciar música y secuencia
reproducir_musica()
ventana.after(tiempos[0], actualizar_letra) 

ventana.mainloop()