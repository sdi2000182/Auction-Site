# Auctionhub

## Περιγραφή Εργασίας

Το αντικείμενο της εργασίας ήταν η υλοποίηση ενός συστήματος διαχείρισης δημοπρασιών, και συγκεκριμένα η ανάπτυξη της διεπαφής με front-end τεχνολογίες για τη διαχείριση, προβολή και αλληλεπίδραση με τις δημοπρασίες από τους χρήστες, καθώς και η διασύνδεσή της με το back-end για την αποθήκευση και ανάκτηση των δεδομένων σε πραγματικό χρόνο.

## Ερωτήματα

Ο κώδικας καλύπτει όλα τα ζητούμενα της εργασίας και το μπονους.

## Αρχιτεκτονική & Τεχνολογίες

### Λεπτομερής Αιτιολόγηση Επιλογών

#### Backend – FastAPI

**Υψηλή Απόδοση (Performance)**

- Το FastAPI βασίζεται στο Starlette και το Pydantic, παρέχοντας ασύγχρονη υποστήριξη (async/await)
- Native support για Python type hints και automatic validation
- Benchmark performance συγκρίσιμο με Node.js και Go

**Αυτόματη Τεκμηρίωση API**

- Με FastAPI δημιουργούνται αυτόματα Swagger UI για όλα τα endpoints
- Interactive API documentation με δυνατότητα testing
- Διευκόλυνση στην ανάπτυξη, τη δοκιμή και τη συνεργασία με frontend

**Ασφάλεια και Validation**

- Ισχυρή ενσωμάτωση τύπων δεδομένων μέσω Pydantic
- Αυστηρός έλεγχος εισερχόμενων αιτήσεων
- Built-in security features (OAuth2, JWT, API Keys)

**Γρήγορη Ανάπτυξη**

- Απλότητα και ευκολία χρήσης
- Ταχεία ανάπτυξη πρωτοτύπων και παραγωγικών εφαρμογών
- Μείωση σημαντικά του χρόνου υλοποίησης

#### Frontend – React + TypeScript + Tailwind CSS

**React για Δυναμική Διαχείριση UI**

- Component-based αρχιτεκτονική για επαναχρησιμοποιήσιμα στοιχεία
- Virtual DOM για optimized rendering
- Μεγάλο ecosystem με πλούσια βιβλιοθήκη components
- Strong community support και regular updates

**TypeScript για Ασφάλεια Κώδικα**

- Στατικός έλεγχος τύπων και compile-time error detection
- Μείωση runtime bugs και βελτίωση αξιοπιστίας
- Enhanced IDE support με auto-completion και refactoring
- Καλύτερη maintainability σε large-scale εφαρμογές

**Tailwind CSS για Γρήγορο και Συνεπές Styling**

- Consistency στο design system

#### Database – Postgres

- Χρησιμοποιήθηκε Postgres βαση μαζι με SQLALchemy για το ORM

### Κύρια Χαρακτηριστικά

- **Σύστημα Ταυτοποίησης**: Ασφαλής σύνδεση και εγγραφή χρηστών με JWT
- **Διαχείριση Δημοπρασιών**: Δημιουργία, επεξεργασία και διαχείριση δημοπρασιών
- **Σύστημα Προσφορών**: Real-time bidding
- **Σύστημα Μηνυμάτων**: Επικοινωνία μεταξύ αγοραστών και πωλητών
- **Διαχειριστικός Πίνακας**: Έγκριση χρηστών και διαχείριση συστήματος
- **Συστήσεις Προϊόντων**: Αλγόριθμοι matrix factorization για προτάσεις
- **Εξαγωγή Δεδομένων**: Export σε XML/JSON formats
- **Χάρτες**: Ενσωμάτωση OpenStreetMap για τοποθεσίες
- **Responsive Design**: Πλήρως προσαρμοζόμενο σε όλες τις συσκευές

## Δομή Έργου

```
Auction-Site/
├── app/                          # Backend (Python/FastAPI)
│   ├── main.py                   # Entry point της εφαρμογής
│   ├── config.py                 # Ρυθμίσεις εφαρμογής
│   ├── database.py              # Database configuration
│   ├── auth/                    # Αυθεντικοποίηση
│   │   ├── jwt_handler.py       # JWT handling
│   │   └── dependencies.py      # Auth dependencies
│   ├── models/                  # Database models
│   │   ├── user.py             # User model
│   │   ├── item.py             # Item model
│   │   ├── bid.py              # Bid model
│   │   ├── category.py         # Category model
│   │   └── message.py          # Message model
│   ├── repositories/           # Data access layer
│   ├── routers/               # API endpoints
│   │   ├── auth.py           # Authentication routes
│   │   ├── users.py          # User management
│   │   ├── items.py          # Auction items
│   │   ├── bids.py           # Bidding system
│   │   ├── messages.py       # Messaging system
│   │   └── admin.py          # Admin functions
│   ├── schemas/              # Pydantic models
│   ├── utils/                # Utility functions
│   └── uploads/              # Uploaded files
│
├── auction-platform/           # Frontend (React/TypeScript)
│   ├── public/                # Static files
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── Messages.tsx   # Messaging system
│   │   │   ├── Dashboard.tsx  # Main dashboard
│   │   │   └── ...
│   │   ├── api/              # API client
│   │   ├── context/          # React contexts
│   │   ├── utils/            # Frontend utilities
│   │   └── theme/            # Styling theme
│   ├── package.json          # Dependencies
│   └── tailwind.config.js    # TailwindCSS config
│
└── README.md             # Αυτό το αρχείο
```

##Εγκατάσταση & Εκτέλεση

### Προαπαιτούμενα

- Python 3.8+
- Node.js 16+
- npm ή yarn

### Backend Setup

1. **Δημιουργία Virtual Environment**:

```bash
cd app
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
```

2. **Εγκατάσταση Dependencies**:

```bash
pip install -r requirements.txt
```

3. **Εκτέλεση Backend**:

```bash
python main.py
```

Το Backend θα εκτελεστεί στο: `http://localhost:8000`

### Frontend Setup

1. **Navigate to Frontend Directory**:

```bash
cd auction-platform
```

2. **Εγκατάσταση Dependencies**:

```bash
npm install
```

3. **Εκτέλεση Frontend**:

```bash
npm start
```

Το Frontend θα εκτελεστεί στο: `http://localhost:3000`

## Ρόλοι Χρηστών

### Administrator

- Έγκριση νέων χρηστών
- Διαχείριση όλων των δημοπρασιών
- Εξαγωγή δεδομένων (XML/JSON)
- Παρακολούθηση συστήματος

### Seller (Πωλητής)

- Δημιουργία νέων δημοπρασιών
- Διαχείριση προϊόντων
- Παρακολούθηση προσφορών
- Επικοινωνία με αγοραστές

### Bidder (Αγοραστής)

- Αναζήτηση και περιήγηση δημοπρασιών
- Υποβολή προσφορών
- Παρακολούθηση δημοπρασιών
- Λήψη ειδοποιήσεων

### Visitor (Επισκέπτης)

- Περιήγηση δημοπρασιών (read-only)
- Προβολή λεπτομερειών
- Εγγραφή στην πλατφόρμα

### Database Schema

```sql
Users (id, username, email, role, approved, created_at)
Items (id, name, description, seller_id, category_id, start_price, current_price)
Bids (id, item_id, bidder_id, amount, created_at)
Categories (id, name, parent_id)
Messages (id, sender_id, receiver_id, subject, content, item_id)
```

## Γενικά για την Αρχιτεκτονική

### Repository Pattern Implementation

Το σύστημα χρησιμοποιεί το **Repository Pattern** για την αφαίρεση του data access layer και την καλύτερη οργάνωση των database operations. Τα endpoints καλουν το Repo Layer για CRUD operations.

### Pagination

Έχει γίνει server-side pagination για την αποτελεσματικότερη φόρτωση δεδομένων.

### Authorization

Για να επιτύχουμε authorization με βαση το ρόλο ενός χρήστη
χρησιμοποιήσαμε τα dependencies του fastapi

## Σύστημα Συστάσεων (Recommendation System)

### Αλγόριθμος Matrix Factorization

Το σύστημα συστάσεων βασίζεται στην τεχνική **Matrix Factorization** που αναλύει τις αλληλεπιδράσεις χρηστών-προϊόντων για να προβλέψει προτιμήσεις και να προτείνει σχετικά items. Χρησιμοποιήθηκε εν μέρει το dataset
που δόθηκε καθώς κάποια auctions από κάποια xml φορτώθηκαν στη βάση , υπάρχει το αντίστοιχο σκριπτάκι για αυτό. Ωστόσο, επειδή δεν φορτώσαμε όλα τα XML καταλήξαμε σε κάποιες fallback συναρτήσεις για να έχουμε 100% πληρότητα για τα ελλιπή στοιχεία.

#### Αρχιτεκτονική Αλγορίθμου

#### Κατασκευή User-Item Matrix

Το σύστημα δημιουργεί έναν πίνακα αλληλεπιδράσεων από τα δεδομένα προσφορών:

- **Rows**: Χρήστες (Users)
- **Columns**: Προϊόντα (Items)
- **Values**: Βαθμολογίες βασισμένες σε προσφορές

#### Διαδικασία Εκπαίδευσης

1. **Αρχικοποίηση**: Random factors για users και items
2. **Gradient Descent**: Βελτιστοποίηση μέσω επαναλήψεων
3. **Regularization**: Αποφυγή overfitting

#### Τύποι Συστάσεων

**1. Personalized Recommendations**

```python
def get_recommendations_for_user(user_id, n_recommendations=10):
    # Matrix factorization predictions
    # Φιλτράρισμα items που δεν έχει bid ο user
    # Ταξινόμηση κατά predicted rating
```

**2. Category-based Recommendations**

```python
def get_recommendations_by_category(user_id, n_recommendations=5):
    # Ανάλυση κατηγοριών που προτιμά ο user
    # Προσφορά παρόμοιων items από τις ίδιες κατηγορίες
```

**3. Similar Items**

```python
def get_similar_items(item_id, n_similar=5):
    # Content-based filtering
    # Παρόμοια items βασισμένα σε κατηγορίες
```

**4. Popular Items Fallback**

```python
def _get_popular_items_fallback(n_items):
    # Δημοφιλή items για νέους χρήστες
    # Βασισμένο σε number_of_bids
```

### Scripts Διαχείρισης

#### 1. Train Recommendations Script

**Αρχείο**: `app/scripts/train_recommendations.py`

````bash
# Εκπαίδευση μοντέλου μόνο
python scripts/train_recommendations.py

# Εκπαίδευση + αποθήκευση προ-υπολογισμένων συστάσεων
python scripts/train_recommendations.py --store-recommendations


#### 2. Load XML Data Script

**Αρχείο**: `app/scripts/load_xml_data.py`

```bash
# Φόρτωση XML δεδομένων ως ended auctions
python scripts/load_xml_data.py path/to/items.xml

# Φόρτωση ως active auctions για testing
python scripts/load_xml_data.py path/to/items.xml --active

# Φόρτωση μόνο πρώτων 100 items (sample)
python scripts/load_xml_data.py path/to/items.xml --sample
```
````
