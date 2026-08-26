# Perla Restaurant — Site Modern

Site static (HTML, CSS, JavaScript) + PHP pentru admin meniu.

## Pagini

| URL | Descriere |
|-----|-----------|
| `/meniul-zilei/` | Pagina publica — meniul zilei |
| `/adauga-meniul-zilei/` | **Pagina ascunsa** — editor meniu (fara link in meniu) |

## Configurare parola admin

1. Copiază `config.env.example` → `config.env`
2. Schimbă parola:

```
ADMIN_PASSWORD=parola_ta
```

## Editor meniu (`/adauga-meniul-zilei/`)

- Login cu parola din `config.env`
- Editare telefon comenzi + meniu pentru Luni–Vineri
- **Categorii implicite** (buton Reset):
  - Meniu de baza (400 gr/ml)
  - Meniu italian (300 gr)
  - Meniu fitness (300 gr)
  - Salata (150 gr)
  - Desert (aprox. 150 gr)
- Adauga / sterge categorii si preparate
- Importa fisier JSON existent
- Salveaza direct in `data/meniul-zilei.json`

## Rulare locala

**Preview site (Live Server):** functioneaza pentru paginile publice.

**Salvare meniu:** necesita PHP. Foloseste XAMPP sau:

```bash
php -S localhost:8080
```

Apoi:
- Site: http://localhost:8080/meniul-zilei/
- Admin: http://localhost:8080/adauga-meniul-zilei/

> Live Server (port 5500) **nu ruleaza PHP** — poti edita in admin, dar salvarea merge doar cu PHP.

## Publicare

Urca tot folderul pe hosting cu **PHP** (cPanel etc.). Asigura-te ca:
- `config.env` exista pe server cu parola setata
- folderul `data/` are permisiuni de scriere pentru PHP
