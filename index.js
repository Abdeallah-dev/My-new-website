"use strict";

const STORE_WHATSAPP = "212632819269";
const STORE_EMAIL = "";
const CART_STORAGE_KEY = "phonex-cart";
let products = [];

const LANGUAGE_STORAGE_KEY = "phonex-language";
const supportedLanguages = ["ar", "fr", "en"];
let language = "ar";
try {
  const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (supportedLanguages.includes(savedLanguage)) language = savedLanguage;
} catch (error) {
  console.warn("تعذر قراءة اللغة المحفوظة.", error);
}

const translations = {
  "الرئيسية": ["Accueil", "Home"], "المنتجات": ["Produits", "Products"],
  "من نحن": ["À propos", "About us"], "تواصل معنا": ["Contact", "Contact us"],
  "السلة": ["Panier", "Cart"], "الانتقال إلى سلة المشتريات": ["Aller au panier", "Go to cart"],
  "سلة المشتريات": ["Panier", "Shopping cart"], "عالمك الذكي يبدأ من هنا": ["Votre univers connecté commence ici", "Your smart world starts here"],
  "تقنية تواكبك.": ["La technologie qui vous suit.", "Technology that keeps up with you."],
  "وتجربة تبهرك.": ["Une expérience qui vous surprend.", "An experience that delights you."],
  "هواتف وساعات وسماعات ذكية مختارة بعناية. تصفح منتجاتنا واطلب ما يناسبك بسهولة.": ["Des téléphones, montres et écouteurs connectés soigneusement sélectionnés. Découvrez nos produits et commandez facilement.", "Carefully selected phones, watches, and smart audio. Browse our products and order with ease."],
  "اكتشف المنتجات": ["Découvrir les produits", "Explore products"], "اختيارات مميزة وخدمة موثوقة": ["Une sélection remarquable et un service fiable", "Standout picks and reliable service"],
  "صوت يرافقك": ["Un son qui vous accompagne", "Sound that moves with you"], "يوم أكثر ذكاءً": ["Une journée plus intelligente", "A smarter day"],
  "اكتشف الجديد": ["Découvrez les nouveautés", "Discover what's new"], "مختارة لك من PhoneX": ["Sélectionné pour vous par PhoneX", "Selected for you by PhoneX"],
  "تقنية، على طريقتك.": ["La technologie, à votre façon.", "Technology, your way."],
  "اختيارات هذا الموسم": ["La sélection de la saison", "This season's picks"], "أجهزة أصلية": ["Appareils authentiques", "Authentic devices"],
  "جودة مضمونة": ["Qualité garantie", "Quality you can trust"], "التوصيل إلى باب منزلك": ["Livraison à votre porte", "Delivered to your door"],
  "إلى جميع المدن المغربية": ["Dans toutes les villes du Maroc", "Across cities in Morocco"], "خدمة موثوقة": ["Un service fiable", "Reliable service"],
  "نحن هنا لمساعدتك": ["Nous sommes là pour vous aider", "We're here to help"],
  "تشكيلة متنوعة": ["Une sélection variée", "A curated collection"], "اكتشف علامتك التجارية المفضلة": ["Découvrez votre marque préférée", "Discover your favorite brand"],
  "من الهواتف الاقتصادية إلى الإصدارات الرائدة والقابلة للطي.": ["Des téléphones abordables aux modèles premium et pliables.", "From budget phones to flagship and foldable models."],
  "اكتشف جميع الهواتف": ["Voir tous les téléphones", "Explore all phones"], "سلسلة Xiaomi": ["La gamme Xiaomi", "The Xiaomi range"],
  "سلاسل متنوعة": ["Plusieurs gammes", "Multiple ranges"], "والمزيد": ["Et bien plus", "And more"],
  "اكتشف التشكيلة كاملة": ["Découvrez toute la collection", "Explore the full collection"],
  "اختيارات PhoneX": ["La sélection PhoneX", "PhoneX picks"], "اكتشف أحدث المنتجات": ["Découvrez les nouveautés", "Discover the latest products"],
  "هواتف وإكسسوارات ذكية تجعل حياتك اليومية أسهل.": ["Des téléphones et accessoires connectés pour simplifier votre quotidien.", "Phones and smart accessories to make everyday life easier."],
  "جميع المنتجات": ["Tous les produits", "All products"], "تصفح جميع المنتجات": ["Parcourir tous les produits", "Browse all products"],
  "هل لديك سؤال عن أحد المنتجات؟": ["Une question sur un produit ?", "Have a question about a product?"],
  "فريق PhoneX جاهز لمساعدتك.": ["L'équipe PhoneX est là pour vous aider.", "The PhoneX team is ready to help."],
  "إجابات واضحة": ["Des réponses claires", "Clear answers"], "الأسئلة الشائعة": ["Questions fréquentes", "Frequently asked questions"],
  "معلومات سريعة تساعدك قبل اختيار منتجك.": ["Des informations utiles avant de choisir.", "Helpful information before you choose."],
  "كيف أطلب منتجاً من PhoneX؟": ["Comment commander chez PhoneX ?", "How do I order from PhoneX?"],
  "أضف المنتجات إلى السلة، وأدخل معلومات التوصيل، ثم راجع طلبك وأكّده. يمكنك بعد ذلك إرسال تفاصيله إلى المتجر عبر WhatsApp.": ["Ajoutez les produits au panier, saisissez vos informations de livraison, puis vérifiez et confirmez votre commande. Vous pourrez ensuite envoyer les détails au magasin via WhatsApp.", "Add products to your cart, enter delivery details, then review and confirm your order. You can then send the details to the store via WhatsApp."],
  "هل الأسعار والتوفر نهائيان؟": ["Les prix et la disponibilité sont-ils définitifs ?", "Are prices and availability final?"],
  "الأسعار المعروضة استرشادية؛ يرجى التواصل معنا لتأكيد السعر والتوفر والإصدار قبل الشراء.": ["Les prix affichés sont indicatifs. Contactez-nous pour confirmer le prix, la disponibilité et la version avant achat.", "Prices shown are indicative. Contact us to confirm price, availability, and model before purchase."],
  "هل يتوفر التوصيل إلى مدينتي؟": ["La livraison est-elle disponible dans ma ville ?", "Is delivery available in my city?"],
  "التوصيل متاح لجميع المدن المغربية، وتُؤكد تفاصيل التكلفة والمدة مع المتجر عند التواصل.": ["La livraison est disponible dans toutes les villes du Maroc. Le coût et les délais sont confirmés avec le magasin.", "Delivery is available across Moroccan cities. Confirm cost and timing with the store."],
  "هل يُرسل تأكيد الطلب تلقائياً إلى المتجر؟": ["La confirmation est-elle envoyée automatiquement au magasin ?", "Is the order confirmation sent to the store automatically?"],
  "التأكيد في الموقع تجريبي ومحفوظ على جهازك فقط. لإرسال تفاصيل الطلب إلى المتجر، استخدم زر WhatsApp بعد التأكيد.": ["La confirmation sur le site est une démonstration enregistrée uniquement sur votre appareil. Utilisez WhatsApp après confirmation pour envoyer les détails au magasin.", "Website confirmation is a demo saved only on your device. Use WhatsApp after confirming to send your order details to the store."],
  "اختيارات ذكية. تجربة أسهل.": ["Des choix intelligents. Une expérience simplifiée.", "Smart choices. A simpler experience."],
  "روابط التذييل": ["Liens de pied de page", "Footer links"], "البريد الإلكتروني": ["E-mail", "Email"],
  "البريد الإلكتروني (أضف العنوان)": ["E-mail (ajoutez une adresse)", "Email (add an address)"],
  "©": ["©", "©"], "PhoneX. جميع الحقوق محفوظة.": ["PhoneX. Tous droits réservés.", "PhoneX. All rights reserved."],
  "العودة إلى أعلى الصفحة": ["Retour en haut", "Back to top"], "اكتشف ما يناسبك": ["Trouvez ce qui vous convient", "Find what suits you"],
  "منتجات PhoneX": ["Les produits PhoneX", "PhoneX products"], "تشكيلة من الهواتف والسماعات والساعات الذكية بصور فوتوغرافية استرشادية.": ["Une sélection de téléphones, écouteurs et montres connectées avec des photos indicatives.", "A selection of phones, audio, and smartwatches with illustrative photos."],
  "التشكيلة الكاملة": ["Toute la collection", "Full collection"], "ابحث عن منتج...": ["Rechercher un produit...", "Search products..."],
  "البحث عن منتج": ["Rechercher un produit", "Search products"], "الكل": ["Tout", "All"],
  "هواتف": ["Téléphones", "Phones"], "سماعات": ["Audio", "Audio"], "ساعات ذكية": ["Montres connectées", "Smartwatches"],
  "تصفية المنتجات": ["Filtrer les produits", "Filter products"],
  "يرجى تأكيد الأسعار والتوفر مع المتجر عبر WhatsApp.": ["Veuillez confirmer les prix et la disponibilité avec le magasin via WhatsApp.", "Please confirm prices and availability with the store via WhatsApp."],
  "من نحن": ["À propos", "About us"], "تقنية أقرب إليك": ["La technologie à portée de main", "Technology, closer to you"],
  "PhoneX، وجهتك لاكتشاف أجهزة ذكية مختارة بعناية.": ["PhoneX, votre destination pour découvrir des appareils connectés soigneusement sélectionnés.", "PhoneX is your destination for carefully selected smart devices."],
  "قصتنا": ["Notre histoire", "Our story"], "نجعل اختيار التقنية المناسبة تجربة أسهل.": ["Nous simplifions le choix de la bonne technologie.", "We make choosing the right technology easier."],
  "PhoneX متجر يهتم بتقديم مجموعة متنوعة من الهواتف والساعات والسماعات الذكية، مع تجربة تصفح واضحة ومعلومات تساعدك على المقارنة والاختيار بثقة.": ["PhoneX propose une variété de téléphones, montres et écouteurs connectés, avec une navigation claire et des informations pour comparer et choisir en confiance.", "PhoneX offers a range of phones, smartwatches, and audio, with clear browsing and helpful information for confident choices."],
  "نؤمن أن الوصول إلى التقنية المناسبة يبدأ بخيارات منتقاة بعناية، وتواصل صريح، وخدمة تضع احتياجات الزبون في المقام الأول.": ["Nous croyons que la bonne technologie commence par une sélection soignée, une communication transparente et un service centré sur vos besoins.", "We believe the right technology starts with thoughtful choices, clear communication, and service focused on your needs."],
  "اكتشف منتجاتنا": ["Découvrir nos produits", "Explore our products"], "اختيارات ذكية. تجربة أسهل.": ["Des choix intelligents. Une expérience simplifiée.", "Smart choices. A simpler experience."],
  "ما الذي يوجّهنا؟": ["Ce qui nous guide", "What guides us"], "رسالتنا ورؤيتنا وأهدافنا": ["Notre mission, notre vision et nos objectifs", "Our mission, vision, and goals"],
  "نعمل باستمرار لتقديم تجربة تسوق تقنية موثوقة ومريحة.": ["Nous travaillons à offrir une expérience d'achat technologique fiable et agréable.", "We work to provide a trusted and convenient technology shopping experience."],
  "رسالتنا": ["Notre mission", "Our mission"], "تسهيل وصول زبنائنا إلى أجهزة ذكية مناسبة، من خلال تشكيلة متنوعة ومعلومات واضحة وخدمة قريبة منهم.": ["Faciliter l'accès à des appareils adaptés grâce à une sélection variée, des informations claires et un service de proximité.", "Make suitable smart devices accessible through variety, clear information, and helpful service."],
  "رؤيتنا": ["Notre vision", "Our vision"], "أن نكون وجهة موثوقة للتقنية، وأن نطوّر تجربة تسوق تجمع بين سهولة الاختيار وجودة الخدمة.": ["Devenir une destination technologique de confiance avec une expérience alliant choix facile et service de qualité.", "Become a trusted tech destination with an experience combining easy choices and quality service."],
  "أهدافنا": ["Nos objectifs", "Our goals"], "تنمية تشكيلتنا، وتحسين تجربة الزبون، وتعزيز التواصل الفعّال قبل الطلب وبعده.": ["Élargir notre sélection, améliorer l'expérience client et renforcer les échanges avant et après commande.", "Grow our selection, improve the customer experience, and strengthen communication before and after ordering."],
  "لماذا PhoneX؟": ["Pourquoi PhoneX ?", "Why PhoneX?"], "عناية في كل خطوة": ["À vos côtés à chaque étape", "Care at every step"],
  "من لحظة اكتشاف المنتج إلى التواصل مع فريقنا.": ["De la découverte du produit au contact avec notre équipe.", "From discovering a product to speaking with our team."],
  "اختيار بعناية": ["Sélection rigoureuse", "Carefully selected"], "نعرض فئات وأجهزة متنوعة لنساعدك في العثور على ما يلائم احتياجاتك اليومية.": ["Nous proposons plusieurs catégories et appareils pour répondre à vos besoins quotidiens.", "We offer a range of devices to help meet your everyday needs."],
  "جودة ووضوح": ["Qualité et transparence", "Quality and clarity"], "نحرص على جودة المنتجات، ونوضح أن الأسعار والصور استرشادية إلى حين تأكيد التفاصيل مع المتجر.": ["Nous veillons à la qualité et précisons que prix et photos sont indicatifs jusqu'à confirmation par le magasin.", "We care about quality and clarify that prices and photos are indicative until confirmed by the store."],
  "رضا الزبون": ["Satisfaction client", "Customer satisfaction"], "نهتم بتجربتك ونبقى قريبين للإجابة عن استفساراتك وتأكيد احتياجاتك قبل الشراء.": ["Votre expérience compte : nous sommes disponibles pour répondre à vos questions avant achat.", "Your experience matters. We're here to answer questions and confirm your needs before purchase."],
  "التزامنا تجاهك": ["Notre engagement", "Our commitment"], "رضاك وثقتك هما أساس تطورنا. نلتزم بتقديم معلومات واضحة، والاهتمام بجودة المنتجات، والاستماع إلى ملاحظاتك لتحسين تجربتك معنا.": ["Votre satisfaction et votre confiance nous font avancer. Nous nous engageons à fournir des informations claires, des produits de qualité et à écouter vos retours.", "Your trust and satisfaction drive us. We provide clear information, care about quality, and listen to your feedback."],
  "نحن دائماً بالقرب منك": ["Toujours à vos côtés", "We're here for you"], "يسعدنا الإجابة عن أسئلتك ومساعدتك في اختيار المنتج المناسب.": ["Nous sommes heureux de répondre à vos questions et de vous aider à choisir.", "We're happy to answer your questions and help you choose the right product."],
  "أرسل لنا رسالة": ["Envoyez-nous un message", "Send us a message"], "أدخل معلوماتك ورسالتك لنساعدك بسرعة.": ["Indiquez vos coordonnées et votre message pour une réponse rapide.", "Enter your details and message so we can help quickly."],
  "الاسم الكامل": ["Nom complet", "Full name"], "رقم الهاتف": ["Téléphone", "Phone number"], "المدينة": ["Ville", "City"],
  "عنوان التوصيل بالتفصيل": ["Adresse de livraison détaillée", "Detailed delivery address"], "ملاحظات إضافية": ["Remarques supplémentaires", "Additional notes"],
  "(اختياري)": ["(facultatif)", "(optional)"], "مثال: سارة العلوي": ["Ex. : Sara Alaoui", "e.g. Sara Alami"],
  "مثال: الدار البيضاء": ["Ex. : Casablanca", "e.g. Casablanca"], "الحي، اسم الشارع، رقم المنزل أو أقرب معلم...": ["Quartier, rue, numéro ou point de repère...", "Neighborhood, street, house number, or landmark..."],
  "وقت مناسب للتوصيل أو أي تفاصيل أخرى...": ["Heure de livraison souhaitée ou autres détails...", "Preferred delivery time or other details..."],
  "رسالتك": ["Votre message", "Your message"], "كيف يمكننا مساعدتك؟": ["Comment pouvons-nous vous aider ?", "How can we help you?"],
  "متابعة عبر WhatsApp": ["Continuer sur WhatsApp", "Continue on WhatsApp"], "تواصل مباشر": ["Contact direct", "Direct contact"],
  "يسعد فريق PhoneX بمساعدتك.": ["L'équipe PhoneX est là pour vous aider.", "The PhoneX team is happy to help."],
  "المجموع التقديري": ["Total estimé", "Estimated total"], "إدارة السلة": ["Gérer le panier", "Manage cart"],
  "التوصيل": ["Livraison", "Delivery"], "متوفر لجميع المدن المغربية": ["Disponible dans toutes les villes du Maroc", "Available across Moroccan cities"],
  "ستُفتح رسالة WhatsApp لمراجعتها وإرسالها بنفسك إلى المتجر.": ["Un message WhatsApp s'ouvrira pour que vous puissiez le vérifier et l'envoyer au magasin.", "A WhatsApp message will open for you to review and send to the store."],
  "بقيت خطوة واحدة لإتمام طلبك": ["Encore une étape pour finaliser", "One step left to complete your order"],
  "إتمام الطلب": ["Finaliser la commande", "Checkout"], "راجع المنتجات المختارة، وأدخل معلومات التوصيل، ثم أكد الطلب وأرسل تفاصيله إلى المتجر عبر WhatsApp.": ["Vérifiez les produits, saisissez vos coordonnées de livraison, puis confirmez et envoyez la commande au magasin via WhatsApp.", "Review your items, enter delivery details, then confirm and send the order to the store via WhatsApp."],
  "معلومات التوصيل": ["Informations de livraison", "Delivery information"], "أدخل المعلومات اللازمة لتوصيل طلبك.": ["Saisissez les informations nécessaires à la livraison.", "Enter the information needed to deliver your order."],
  "تُحفظ نسخة تجريبية من الطلب في هذا الجهاز فقط، ويمكنك إرساله للمتجر عبر WhatsApp بعد التأكيد.": ["Une copie de démonstration est enregistrée uniquement sur cet appareil. Vous pourrez envoyer la commande au magasin via WhatsApp après confirmation.", "A demo copy of the order is saved on this device only. You can send it to the store via WhatsApp after confirmation."],
  "مراجعة الطلب": ["Vérifier la commande", "Review order"], "تأكد من معلومات التوصيل والمنتجات قبل التأكيد.": ["Vérifiez vos coordonnées et les produits avant de confirmer.", "Check delivery details and products before confirming."],
  "العنوان": ["Adresse", "Address"], "ملاحظات": ["Remarques", "Notes"], "المجموع الإجمالي": ["Total général", "Grand total"],
  "تعديل المعلومات": ["Modifier les informations", "Edit information"], "تأكيد الطلب": ["Confirmer la commande", "Confirm order"],
  "ملخص الطلب": ["Résumé de la commande", "Order summary"], "تحقق من المنتجات والكميات قبل الإرسال.": ["Vérifiez les produits et les quantités avant l'envoi.", "Check products and quantities before sending."],
  "المبلغ بالدرهم المغربي (MAD)": ["Montant en dirhams marocains (MAD)", "Amount in Moroccan dirhams (MAD)"],
  "سيتم تأكيد تكلفة التوصيل معك عبر WhatsApp.": ["Les frais de livraison seront confirmés avec vous via WhatsApp.", "Delivery costs will be confirmed with you via WhatsApp."],
  "تصفح المنتجات": ["Parcourir les produits", "Browse products"], "تم تأكيد طلبك بنجاح!": ["Commande confirmée avec succès !", "Your order has been confirmed!"],
  "رقم الطلب:": ["N° de commande :", "Order number:"], "التأكيد تجريبي ومحفوظ على هذا الجهاز فقط. لإرسال تفاصيل الطلب إلى المتجر، استخدم WhatsApp أدناه.": ["Cette confirmation de démonstration est enregistrée sur cet appareil uniquement. Utilisez WhatsApp ci-dessous pour envoyer les détails au magasin.", "This demo confirmation is saved on this device only. Use WhatsApp below to send the details to the store."],
  "إرسال التفاصيل عبر WhatsApp": ["Envoyer les détails via WhatsApp", "Send details via WhatsApp"],
  "العودة إلى الصفحة الرئيسية": ["Retour à l'accueil", "Back to home"], "شكراً لاختيارك PhoneX": ["Merci d'avoir choisi PhoneX", "Thank you for choosing PhoneX"],
  "تم تسجيل تفاصيل طلبك التجريبي على هذا الجهاز.": ["Les détails de votre commande de démonstration sont enregistrés sur cet appareil.", "Your demo order details have been saved on this device."],
  "تعذر العثور على الطلب": ["Commande introuvable", "Order not found"],
  "لم نعثر على تفاصيل هذا الطلب في هذا الجهاز.": ["Les détails de cette commande sont introuvables sur cet appareil.", "We couldn't find this order on this device."],
  "ابدأ من السلة لإدخال معلوماتك وتأكيد الطلب.": ["Commencez par le panier pour saisir vos informations et confirmer.", "Start from your cart to enter your details and confirm your order."],
  "العودة إلى السلة": ["Retour au panier", "Back to cart"], "تفاصيل المنتج": ["Détails du produit", "Product details"],
  "راجع المعلومات قبل إضافة المنتج إلى السلة.": ["Consultez les informations avant d'ajouter au panier.", "Review details before adding this product to your cart."],
  "المنتج غير موجود": ["Produit introuvable", "Product not found"], "الرابط غير صحيح أو لم يعد المنتج متوفراً.": ["Le lien est incorrect ou le produit n'est plus disponible.", "This link is invalid or the product is no longer available."],
  "العودة إلى قائمة المنتجات": ["Retour aux produits", "Back to products"], "درهم مغربي": ["Dirhams marocains", "Moroccan dirhams"],
  "ثمن استرشادي": ["Prix indicatif", "Indicative price"], "أضف للسلة": ["Ajouter au panier", "Add to cart"],
  "معلومات المنتج": ["Informations sur le produit", "Product information"], "معلومات أولية تساعدك على الاختيار.": ["Quelques informations pour vous aider à choisir.", "Helpful information to guide your choice."],
  "الصور والمعلومات والأسعار تقريبية للتعريف بالمنتج، وقد تختلف حسب الإصدار والمخزون. أكد كل التفاصيل مع المتجر قبل الطلب.": ["Photos, informations et prix sont indicatifs et peuvent varier selon le modèle et le stock. Confirmez les détails avec le magasin avant commande.", "Photos, information, and prices are indicative and may vary by model and stock. Confirm all details with the store before ordering."],
  "الشاشة": ["Écran", "Display"], "التخزين": ["Stockage", "Storage"], "الكاميرا": ["Appareil photo", "Camera"],
  "الخصائص": ["Fonctionnalités", "Features"], "نوع المنتج": ["Type de produit", "Product type"],
  "الاتصال": ["Connectivité", "Connectivity"], "الصوت": ["Audio", "Audio"], "التوافق": ["Compatibilité", "Compatibility"],
  "أضف": ["Ajouter", "Add"], "للسلة": ["au panier", "to cart"], "التفاصيل": ["Détails", "Details"],
  "السلة فارغة": ["Le panier est vide", "Your cart is empty"],
  "هذا الحقل مطلوب.": ["Ce champ est obligatoire.", "This field is required."],
  "يرجى إدخال رقم هاتف صحيح.": ["Veuillez saisir un numéro de téléphone valide.", "Please enter a valid phone number."],
  "السلة فارغة. أضف منتجاً للمتابعة.": ["Votre panier est vide. Ajoutez un produit pour continuer.", "Your cart is empty. Add a product to continue."],
  "لم نعثر على منتجات بهذا الاسم. جرّب كلمة أخرى.": ["Aucun produit trouvé. Essayez un autre terme.", "No products found. Try another search."],
  "تعذّر تحميل الصورة": ["Impossible de charger l'image", "Image could not be loaded"],
  "اختيار مميز": ["Choix vedette", "Featured pick"], "الأكثر طلباً": ["Très demandé", "Best seller"],
  "قيمة ممتازة": ["Excellent rapport qualité-prix", "Great value"], "تصوير مميز": ["Photo remarquable", "Great photography"],
  "صوت نقي": ["Son pur", "Clear sound"], "عزل صوتي": ["Réduction de bruit", "Noise isolation"],
  "خفيفة وعملية": ["Légère et pratique", "Light and practical"], "جودة عالية": ["Haute qualité", "High quality"],
  "إصدار حديث": ["Nouveau modèle", "Latest release"], "تصميم أنيق": ["Design élégant", "Elegant design"],
  "شاشة كبيرة": ["Grand écran", "Large display"], "بطارية قوية": ["Batterie performante", "Long-lasting battery"],
  "للرياضة": ["Pour le sport", "For sports"], "صوت غامر": ["Son immersif", "Immersive sound"],
  "بسعر مناسب": ["Prix avantageux", "Affordable"], "صوت قوي": ["Son puissant", "Powerful sound"],
  "للألعاب": ["Pour le gaming", "For gaming"], "عملي كل يوم": ["Pratique au quotidien", "Everyday practicality"],
  "تعذر حفظ الطلب على هذا الجهاز. تحقق من مساحة التخزين وحاول مجدداً.": ["Impossible d'enregistrer la commande sur cet appareil. Vérifiez l'espace disponible et réessayez.", "Couldn't save the order on this device. Check storage space and try again."],
  "تم تأكيد الطلب، لكن تعذر تحديث السلة على هذا الجهاز.": ["Commande confirmée, mais le panier n'a pas pu être mis à jour sur cet appareil.", "Order confirmed, but the cart couldn't be updated on this device."],
  "أُضيف": ["Ajouté :", "Added"], "إلى السلة": ["au panier", "to cart"],
  "رسالة تواصل من متجر PhoneX": ["Message au magasin PhoneX", "Message to PhoneX store"],
  "المنتجات المختارة:": ["Produits sélectionnés :", "Selected products:"], "لا توجد منتجات مختارة.": ["Aucun produit sélectionné.", "No products selected."],
  "الاسم الكامل:": ["Nom complet :", "Full name:"], "رقم الهاتف:": ["Téléphone :", "Phone:"],
  "المدينة:": ["Ville :", "City:"], "عنوان التوصيل:": ["Adresse de livraison :", "Delivery address:"],
  "السعر الإجمالي:": ["Total :", "Grand total:"], "ملاحظات إضافية:": ["Remarques :", "Additional notes:"],
  "الرسالة:": ["Message :", "Message:"], "الكمية:": ["Quantité :", "Qty:"], "للوحدة": ["par unité", "each"],
  "حذف المنتج": ["Supprimer", "Remove"], "كمية": ["Quantité", "Quantity"],
  "تمت إضافة المنتج إلى السلة": ["Produit ajouté au panier", "Product added to cart"],
  "ستُفتح رسالة WhatsApp لمراجعة معلوماتك والمنتجات المختارة قبل إرسالها إلى المتجر.": ["Un message WhatsApp s'ouvrira pour vérifier vos informations et les produits avant l'envoi au magasin.", "A WhatsApp message will open to review your details and selected products before sending to the store."],
  "كاميرا": ["Appareil photo", "Camera"], "شاشة": ["Écran", "Display"], "بطارية": ["Batterie", "Battery"],
  "صوت": ["Son", "Sound"], "تتبع النشاط": ["Suivi d'activité", "Activity tracking"],
  "إلغاء الضوضاء": ["Réduction du bruit", "Noise cancellation"], "إلغاء ضجيج نشط": ["Réduction active du bruit", "Active noise cancellation"],
  "مقاومة للماء": ["Résistant à l'eau", "Water-resistant"], "مكبر صوت": ["Enceinte", "Speaker"],
  "سماعات صوت": ["Écouteurs", "Headphones"], "ساعة ذكية": ["Montre connectée", "Smartwatch"],
  "سوار ذكي": ["Bracelet connecté", "Smart band"], "ساعة رياضية": ["Montre sport", "Sports watch"],
  "حرّك الصورة لمعاينتها": ["Survolez l'image pour l'examiner", "Hover over the image to preview"],
  "هاتف ذكي للاستخدام اليومي": ["un smartphone pour le quotidien", "a smartphone for everyday use"],
  "هاتف ذكي": ["Smartphone", "Smartphone"], "ساعة ذكية للاستخدام اليومي ومتابعة النشاط": ["une montre connectée pour le quotidien et le suivi d'activité", "a smartwatch for daily use and activity tracking"],
  "خيار للاستماع إلى الموسيقى وإجراء المكالمات": ["un choix idéal pour écouter de la musique et passer des appels", "a great choice for music and calls"],
  "تواصل معنا للتأكد من السعة واللون والإصدار المتوفر.": ["Contactez-nous pour confirmer le stockage, la couleur et le modèle disponible.", "Contact us to confirm available storage, color, and model."],
  "استفسر عن التوافق والإصدار قبل الطلب.": ["Renseignez-vous sur la compatibilité et le modèle avant commande.", "Ask about compatibility and model before ordering."],
  "استفسر عن التوافق والخصائص المتوفرة.": ["Renseignez-vous sur la compatibilité et les fonctionnalités disponibles.", "Ask about compatibility and available features."],
  "كاميرا 48MP": ["Appareil photo 48 MP", "48MP camera"], "شاشة AMOLED": ["Écran AMOLED", "AMOLED display"],
  "كاميرا ذكية": ["Appareil photo intelligent", "Smart camera"], "شاشة ProMotion": ["Écran ProMotion", "ProMotion display"],
  "بطارية طويلة": ["Batterie longue durée", "Long battery life"], "شحن سريع": ["Charge rapide", "Fast charging"],
  "شاشة ملونة عالية الدقة": ["Écran couleur haute résolution", "High-resolution color display"],
  "نظام تصوير متعدد حسب الإصدار": ["Système photo variable selon le modèle", "Camera system varies by model"],
  "تتوفر سعات مختلفة — يرجى تأكيد الإصدار": ["Plusieurs capacités disponibles — confirmez le modèle", "Multiple capacities available — confirm the model"],
  "يرجى تأكيد المعالج والبطارية والضمان قبل الشراء": ["Veuillez confirmer le processeur, la batterie et la garantie avant achat", "Please confirm processor, battery, and warranty before purchase"],
  "إلغاء الضوضاء · Bluetooth": ["Réduction du bruit · Bluetooth", "Noise cancellation · Bluetooth"],
  "صوت جهوري · مريحة": ["Son puissant · confortable", "Rich sound · comfortable"],
  "بطارية طويلة · لاسلكية": ["Batterie longue durée · sans fil", "Long battery life · wireless"],
  "تتبع النشاط · مقاومة للماء": ["Suivi d'activité · résistant à l'eau", "Activity tracking · water-resistant"],
  "شاشة AMOLED · GPS": ["Écran AMOLED · GPS", "AMOLED display · GPS"],
  "تتبع الصحة · بطارية طويلة": ["Suivi santé · batterie longue durée", "Health tracking · long battery life"],
  "رياضة وصحة · شاشة ملونة": ["Sport et santé · écran couleur", "Sports and health · color display"],
  "السعر والتوفر": ["prix et disponibilité", "price and availability"],
  "السلة فارغة حالياً. تصفح المنتجات واختر ما يناسبك.": ["Votre panier est vide. Parcourez les produits et choisissez ce qui vous convient.", "Your cart is empty. Browse products and find what suits you."],
  "PhoneX | الرئيسية": ["PhoneX | Accueil", "PhoneX | Home"],
  "PhoneX | المنتجات": ["PhoneX | Produits", "PhoneX | Products"],
  "PhoneX | من نحن": ["PhoneX | À propos", "PhoneX | About us"],
  "PhoneX | تواصل معنا": ["PhoneX | Contact", "PhoneX | Contact us"],
  "PhoneX | إتمام الطلب": ["PhoneX | Commander", "PhoneX | Checkout"],
  "PhoneX | تأكيد الطلب": ["PhoneX | Confirmation", "PhoneX | Order confirmation"],
  "PhoneX | تفاصيل المنتج": ["PhoneX | Détails du produit", "PhoneX | Product details"],
  "أجهزة وتقنيات حديثة ضمن مساحة عمل": ["Appareils et technologies modernes dans un espace de travail", "Modern devices and technology in a workspace"],
  "Galaxy و Z القابل للطي": ["Galaxy et Z pliable", "Galaxy and foldable Z"],
  "Reno و A": ["Reno et A", "Reno and A"],
  "ثمن استرشادي": ["Prix indicatif", "Indicative price"],
  "بمواصفات من بينها": ["avec notamment les caractéristiques suivantes :", "with specifications including"],
  "، بالمميزات التالية:": [", avec les caractéristiques suivantes :", ", with the following features:"],
  "يرجى تأكيد السعر والتوفر مع المتجر عبر WhatsApp.": ["Veuillez confirmer le prix et la disponibilité auprès du magasin via WhatsApp.", "Please confirm price and availability with the store via WhatsApp."],
  "شاشة ملونة لعرض المعلومات والإشعارات": ["Écran couleur pour afficher les informations et notifications", "Color display for information and notifications"],
  "لاسلكية؛ يرجى التحقق من طريقة الاتصال الخاصة بالموديل": ["Sans fil ; vérifiez la connectivité du modèle", "Wireless; check the model's connectivity"],
  "صوت واضح للاستخدام اليومي": ["Son clair pour un usage quotidien", "Clear sound for everyday use"],
  "الهواتف والأجهزة المتوافقة؛ يرجى التحقق من الإصدار قبل الشراء": ["Téléphones et appareils compatibles ; vérifiez le modèle avant achat", "Compatible phones and devices; check the model before purchase"],
  "متابعة النشاط والإشعارات": ["Suivi d'activité et notifications", "Activity tracking and notifications"],
  "Bluetooth؛ يرجى التحقق من التوافق مع هاتفك": ["Bluetooth ; vérifiez la compatibilité avec votre téléphone", "Bluetooth; check compatibility with your phone"],
  "تعتمد بعض الميزات على نظام تشغيل الهاتف والإصدار": ["Certaines fonctions dépendent du système et du modèle du téléphone", "Some features depend on your phone's operating system and model"],
  "سماعات لاسلكية Pro": ["Écouteurs sans fil Pro", "Pro wireless earbuds"],
  "سماعات لاسلكية Studio": ["Écouteurs sans fil Studio", "Studio wireless headphones"],
  "صوت واضح": ["Son clair", "Clear sound"], "علبة شحن": ["Boîtier de recharge", "Charging case"],
  "حياة أذكى": ["Un quotidien plus intelligent", "A smarter life"], "خفيف ومريح": ["Léger et confortable", "Light and comfortable"],
  "قوي وسريع": ["Puissant et rapide", "Powerful and fast"], "تصوير احترافي": ["Photo professionnelle", "Pro photography"],
  "صور بورتريه": ["Portraits", "Portrait photos"], "أداء قوي": ["Performances puissantes", "Powerful performance"],
  "فئة رائدة": ["Haut de gamme", "Flagship"], "متوازن": ["Équilibré", "Balanced"],
  "قابل للطي": ["Pliable", "Foldable"], "تصميم قابل للطي": ["Design pliable", "Foldable design"],
  "اقتصادي": ["Abordable", "Budget-friendly"], "أداء سريع": ["Performances rapides", "Fast performance"],
  "بطارية كبيرة": ["Grande batterie", "Large battery"], "تصوير واضح": ["Photos nettes", "Clear photography"],
  "كاميرا متطورة": ["Appareil photo avancé", "Advanced camera"], "تصميم خفيف": ["Design léger", "Lightweight design"],
  "تصميم مختلف": ["Design original", "Distinctive design"], "تصميم أنيق": ["Design élégant", "Elegant design"],
  "قيمة مناسبة": ["Excellent rapport qualité-prix", "Great value"], "للصور اليومية": ["Pour les photos du quotidien", "For everyday photos"],
  "كاميرا عالية الدقة": ["Appareil photo haute résolution", "High-resolution camera"],
  "للاستخدام الشاق": ["Pour les usages intensifs", "For rugged use"], "تصميم متين": ["Design robuste", "Durable design"],
  "خفيفة ومريحة": ["Légères et confortables", "Lightweight and comfortable"], "صوت مكاني": ["Audio spatial", "Spatial audio"],
  "عزل احترافي": ["Réduction de bruit professionnelle", "Pro noise cancellation"],
  "عزل ضجيج": ["Réduction du bruit", "Noise cancellation"], "صوت عالي الدقة": ["Audio haute résolution", "High-resolution audio"],
  "مكبر صوت Bluetooth": ["Enceinte Bluetooth", "Bluetooth speaker"], "مقاوم للماء": ["Résistant à l'eau", "Water-resistant"],
  "عزل ضجيج هجين": ["Réduction de bruit hybride", "Hybrid noise cancellation"],
  "GPS · متابعة النشاط": ["GPS · suivi d'activité", "GPS · activity tracking"],
  "تصميم رفيع": ["Design fin", "Slim design"], "مستشعرات صحية": ["Capteurs de santé", "Health sensors"],
  "رفيق الرياضة": ["Compagnon sportif", "Fitness companion"], "مكالمات Bluetooth": ["Appels Bluetooth", "Bluetooth calls"],
  "للرياضة اليومية": ["Pour le sport au quotidien", "For everyday sports"],
  "قابلة للطي": ["Pliable", "Foldable"], "تصميم Glyph": ["Design Glyph", "Glyph design"],
  "شاشة أنيقة": ["Écran élégant", "Elegant display"], "لاسلكية": ["Sans fil", "Wireless"],
  "تتبع الصحة والرياضة": ["Suivi santé et sport", "Health and sports tracking"],
  "لم نعثر على منتجات بهذا الاسم. جرّب كلمة أخرى.": ["Aucun produit trouvé. Essayez un autre terme.", "No products found. Try another search."]
};

const localeCodes = { ar: "ar-MA", fr: "fr-MA", en: "en-MA" };
function localizePage(root = document) {
  const languageIndex = language === "fr" ? 0 : 1;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (language === "ar") continue;
    const source = node.nodeValue.trim();
    let translated = translations[source]?.[languageIndex];
    if (!translated) {
      translated = source;
      Object.entries(translations)
        .filter(([phrase]) => phrase.length >= 4 && source.includes(phrase))
        .sort(([left], [right]) => right.length - left.length)
        .forEach(([phrase, values]) => {
          translated = translated.replaceAll(phrase, values[languageIndex]);
        });
      translated = translated.replace(/^(\d+)\s+منتجات$/, (_, count) =>
        language === "fr" ? `${count} produits` : `${count} products`);
    }
    if (translated && translated !== source) node.nodeValue = node.nodeValue.replace(source, translated);
  }
  if (language !== "ar") root.querySelectorAll?.("[placeholder], [aria-label], [title], [alt]").forEach(element => {
    ["placeholder", "aria-label", "title", "alt"].forEach(attribute => {
      const source = element.getAttribute(attribute);
      if (source && translations[source]) element.setAttribute(attribute, translations[source][languageIndex]);
    });
  });
  if (root === document) {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    if (language !== "ar") {
      const title = document.title;
      if (translations[title]) document.title = translations[title][languageIndex];
    }
  }
}

function installLanguagePicker() {
  document.querySelectorAll(".header-inner").forEach(header => {
    const cartButton = header.querySelector(".cart-button");
    if (!cartButton) return;
    const label = document.createElement("label");
    label.className = "language-picker";
    label.setAttribute("aria-label", "اختيار اللغة");
    label.innerHTML = '<svg class="language-picker-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>';
    const picker = document.createElement("select");
    picker.setAttribute("aria-label", "اختيار اللغة");
    picker.innerHTML = '<option value="ar">العربية</option><option value="fr">Français</option><option value="en">English</option>';
    picker.value = language;
    picker.addEventListener("change", () => {
      try {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, picker.value);
      } catch (error) {
        console.error("تعذر حفظ اللغة المختارة.", error);
      }
      window.location.reload();
    });
    label.append(picker);
    const actions = document.createElement("div");
    actions.className = "header-actions";
    header.insertBefore(actions, cartButton);
    actions.append(label, cartButton);
  });
}

installLanguagePicker();
localizePage();
const languageObserver = new MutationObserver(records => {
  records.forEach(record => {
    if (record.type === "characterData") localizePage(record.target.parentElement || document);
    else record.addedNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) localizePage(node);
      else if (node.nodeType === Node.TEXT_NODE) localizePage(node.parentElement || document);
    });
  });
});
languageObserver.observe(document.body, { childList: true, characterData: true, subtree: true });

const money = new Intl.NumberFormat(localeCodes[language], {
  style: "currency",
  currency: "MAD",
  maximumFractionDigits: 0
});
const page = document.body.dataset.page;
const productGrid = document.getElementById("product-grid");
const customerForm = document.getElementById("customer-form");
const customerDetails = document.getElementById("customer-details");
const orderReview = document.getElementById("order-review");
const orderSuccess = document.getElementById("order-success");
const orderNotFound = document.getElementById("order-not-found");
const reviewItems = document.getElementById("review-items");
const confirmOrderButton = document.getElementById("confirm-order");
const toast = document.getElementById("toast");
let toastTimeout;
let currentOrder = null;
let isConfirmingOrder = false;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealObserver = !reduceMotion && "IntersectionObserver" in window
  ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("reveal-on-scroll");
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12 })
  : null;
let activeCategory = "all";
let searchQuery = "";
let cart = loadCart();
const queryParams = new URLSearchParams(window.location.search);
const requestedCategory = queryParams.get("category");
if (["phones", "audio", "watches"].includes(requestedCategory)) {
  activeCategory = requestedCategory;
}
searchQuery = (queryParams.get("search") || "").trim().toLocaleLowerCase("ar");

function loadCart() {
  const saved = localStorage.getItem(CART_STORAGE_KEY);
  if (!saved) return {};

  try {
    const parsed = JSON.parse(saved);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(([id, quantity]) =>
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) &&
        Number.isInteger(quantity) && quantity > 0 && quantity <= 99
      )
    );
  } catch {
    console.warn("تعذر قراءة السلة المحفوظة؛ سيتم البدء بسلة فارغة.");
    return {};
  }
}

function saveCart() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function getCartProducts() {
  return products
    .filter(product => cart[product.id])
    .map(product => ({ ...product, quantity: cart[product.id] }));
}

function cartTotal() {
  return getCartProducts().reduce((total, product) => total + product.price * product.quantity, 0);
}

const productPhotos = {
  phones: [
    "photo-1592890288564-76628a30a657",
    "photo-1634403665481-74948d815f03",
    "photo-1662947995689-ec5165848ad0",
    "photo-1707438095940-1eee18e85400",
    "photo-1607252650355-f7fd0460ccdb",
    "photo-1483478550801-ceba5fe50e8e",
    "photo-1565849904461-04a58ad377e0",
    "photo-1628320281190-89b24da58b0f",
    "photo-1592750475338-74b7b21085ab",
    "photo-1511707171634-5f897ff02aa9",
    "photo-1510557880182-3d4d3cba35a5",
    "photo-1523206489230-c012c64b2b48",
    "photo-1598327105666-5b89351aff97",
    "photo-1512499617640-c74ae3a79d37",
    "photo-1533228100845-08145b01de14"
  ],
  audio: [
    "photo-1606220945770-b5b6c2c55bf1",
    "photo-1505740420928-5e560c06d30e",
    "photo-1608043152269-423dbba4e7e1",
    "photo-1572569511254-d8f925fe2cbb",
    "photo-1590658268037-6bf12165a8df"
  ],
  watches: [
    "photo-1523275335684-37898b6baf30",
    "photo-1508685096489-7aacd43bd3b1",
    "photo-1544117519-31a4b719223d",
    "photo-1434493789847-2f02dc6ca35d"
  ]
};
const productPhotoIndexes = new Map();
const categoryPhotoCounts = { phones: 0, audio: 0, watches: 0 };
function indexProductPhotos() {
  productPhotoIndexes.clear();
  Object.keys(categoryPhotoCounts).forEach(category => {
    categoryPhotoCounts[category] = 0;
  });
  products.forEach(product => {
    productPhotoIndexes.set(product.id, categoryPhotoCounts[product.category]);
    categoryPhotoCounts[product.category] += 1;
  });
}
const productFallbackPhotos = {
  phones: ["images/products/phone-1.svg", "images/products/phone-2.svg", "images/products/phone-3.svg"],
  audio: ["images/products/audio-1.svg", "images/products/audio-2.svg"],
  watches: ["images/products/watch-1.svg", "images/products/watch-2.svg"]
};
products.forEach(product => {
  productPhotoIndexes.set(product.id, categoryPhotoCounts[product.category]++);
});

function productImage(product, className = "product-image") {
  const photos = productPhotos[product.category];
  const photoIndex = productPhotoIndexes.get(product.id);
  const photoId = photos[photoIndex % photos.length];
  const fallbackImages = productFallbackPhotos[product.category];
  const fallback = fallbackImages[photoIndex % fallbackImages.length];
  const imageSource = typeof product.imageUrl === "string" &&
    (product.imageUrl.startsWith("/images/") || product.imageUrl.startsWith("https://images.unsplash.com/"))
    ? product.imageUrl
    : `https://images.unsplash.com/${photoId}?auto=format&amp;fit=crop&amp;w=900&amp;q=85`;
  const imageClass = className === "product-image" ? "product-image" : `${className} product-image`;
  const hint = className === "mini-product-image" ? "" : '<span class="photo-hint" aria-hidden="true">حرّك الصورة لمعاينتها</span>';
  return `<img class="${imageClass}" src="${escapeHtml(imageSource)}" data-fallback="${escapeHtml(fallback)}" alt="صورة استرشادية للمنتج ${escapeHtml(product.name)}" loading="lazy" decoding="async">${hint}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[character]);
}

async function loadProductCatalog() {
  try {
    const response = await fetch("/api/products", { cache: "no-store" });
    const result = await response.json().catch(() => null);
    if (!response.ok || !Array.isArray(result?.products)) {
      throw new Error(result?.error || "تعذر تحميل المنتجات المتاحة.");
    }
    products = result.products.map(product => ({
      id: product.id,
      name: product.name,
      category: product.category,
      categoryName: product.category_name,
      spec: product.specification,
      price: Number(product.price_mad),
      originalPrice: Number(product.original_price_mad),
      tag: product.tag,
      imageUrl: product.image_url,
      stockOnHand: Number(product.stock_on_hand)
    }));
    indexProductPhotos();
    renderProductDetail();
    renderProducts();
    renderCart();
  } catch (error) {
    console.error("تعذر تحميل كتالوج المنتجات من قاعدة البيانات.", error);
    if (productGrid) {
      productGrid.innerHTML = `<p class="no-results">${escapeHtml(error.message)}</p>`;
    }
    const detail = document.getElementById("product-detail");
    if (detail) {
      detail.innerHTML = `<div class="detail-not-found panel"><h2>${escapeHtml(error.message)}</h2></div>`;
    }
  }
}

function productPriceMarkup(product) {
  const originalPrice = product.originalPrice > product.price
    ? `<del>${money.format(product.originalPrice)}</del>`
    : "";
  return `<strong>${money.format(product.price)}</strong>${originalPrice}`;
}

function renderProducts() {
  if (!productGrid) return;
  const catalog = page === "products";
  const matching = products.filter(product => {
    const categoryMatches = activeCategory === "all" || product.category === activeCategory;
    const searchMatches = !searchQuery ||
      `${product.name} ${product.categoryName} ${product.spec}`.toLocaleLowerCase("ar").includes(searchQuery);
    return categoryMatches && searchMatches;
  });
  const shownProducts = catalog ? matching : products.slice(0, 4);

  productGrid.innerHTML = shownProducts.length ? shownProducts.map(product => `
    <article class="product-card" tabindex="0" aria-label="عرض معلومات ${escapeHtml(product.name)}">
      <a class="product-photo" href="product.html?id=${encodeURIComponent(product.id)}" aria-label="تفاصيل ${escapeHtml(product.name)}">
        ${productImage(product)}
        <span class="product-tag">${escapeHtml(product.tag)}</span>
      </a>
      <div class="product-info">
        <span class="product-category">${escapeHtml(product.categoryName)}</span>
        <h3><a href="product.html?id=${encodeURIComponent(product.id)}">${escapeHtml(product.name)}</a></h3>
        <div class="product-spec">${escapeHtml(product.spec)}</div>
        <div class="product-buy">
          <div class="product-price">${productPriceMarkup(product)}<span>درهم مغربي</span><small>${product.stockOnHand > 0 ? `متوفر: ${product.stockOnHand}` : "نفد المخزون"}</small></div>
          <div class="product-actions">
            <a class="details-button" href="product.html?id=${encodeURIComponent(product.id)}">التفاصيل</a>
            <button class="add-button" type="button" data-add="${escapeHtml(product.id)}" aria-label="أضف ${escapeHtml(product.name)} إلى السلة"${product.stockOnHand < 1 || (cart[product.id] || 0) >= product.stockOnHand ? " disabled" : ""}>
              <span aria-hidden="true">+</span> للسلة
            </button>
          </div>
        </div>
      </div>
    </article>`).join("") : `<p class="no-results">${products.length
      ? "لم نعثر على منتجات بهذا الاسم. جرّب كلمة أخرى."
      : "لا توجد منتجات مؤكدة ومتاحة للشراء حالياً. أضف المنتجات وراجع الثمن والمخزون من لوحة الإدارة."}</p>`;
  if (catalog) {
    productGrid.querySelectorAll(".product-card").forEach((card, index) => {
      card.style.setProperty("--catalog-stagger", `${(index % 4) * 65}ms`);
    });
  }
  observeReveals(productGrid.querySelectorAll(".product-card"));

  const count = document.getElementById("results-count");
  if (count) count.textContent = `${matching.length} منتجات`;
  const title = document.getElementById("catalog-title");
  if (title) title.textContent = activeCategory === "all" ? "جميع المنتجات" :
    activeCategory === "phones" ? "الهواتف" :
      activeCategory === "audio" ? "السماعات" : "الساعات الذكية";
}

function getProductSpecifications(product) {
  const storage = product.spec.match(/\b\d+\s*GB\b/i);
  if (product.category === "phones") {
    const display = product.spec.match(/شاشة[^·]*/)?.[0] || "شاشة ملونة عالية الدقة";
    const camera = product.spec.match(/كاميرا[^·]*/)?.[0] || "نظام تصوير متعدد حسب الإصدار";
    return [
      ["الشاشة", display],
      ["التخزين", storage ? storage[0].replace(/\s+/g, "") : "تتوفر سعات مختلفة — يرجى تأكيد الإصدار"],
      ["الكاميرا", camera],
      ["الخصائص", "يرجى تأكيد المعالج والبطارية والضمان قبل الشراء"]
    ];
  }
  if (product.category === "audio") {
    const connection = product.spec.match(/Bluetooth[^·]*/i)?.[0] || "لاسلكية؛ يرجى التحقق من طريقة الاتصال الخاصة بالموديل";
    const sound = product.spec.match(/(إلغاء[^·]*|عزل[^·]*|صوت[^·]*)/i)?.[0] || "صوت واضح للاستخدام اليومي";
    return [
      ["نوع المنتج", product.spec.includes("مكبر") ? "مكبر صوت" : "سماعات صوت"],
      ["الاتصال", connection],
      ["الصوت", sound],
      ["التوافق", "الهواتف والأجهزة المتوافقة؛ يرجى التحقق من الإصدار قبل الشراء"]
    ];
  }
  const screen = product.spec.match(/شاشة[^·]*/)?.[0] || "شاشة ملونة لعرض المعلومات والإشعارات";
  const tracking = product.spec.match(/(GPS|تتبع[^·]*|مستشعرات[^·]*)/i)?.[0] || "متابعة النشاط والإشعارات";
  return [
    ["الشاشة", screen],
    ["الخصائص", tracking],
    ["الاتصال", "Bluetooth؛ يرجى التحقق من التوافق مع هاتفك"],
    ["التوافق", "تعتمد بعض الميزات على نظام تشغيل الهاتف والإصدار"]
  ];
}

function renderProductDetail() {
  const detail = document.getElementById("product-detail");
  if (!detail) return;
  const productId = new URLSearchParams(window.location.search).get("id");
  const product = products.find(item => item.id === productId);

  if (!product) {
    detail.innerHTML = `
      <div class="detail-not-found panel">
        <span class="section-kicker">${products.length ? "المنتج غير موجود" : "المنتجات غير متاحة حالياً"}</span>
        <h2>${products.length ? "الرابط غير صحيح أو لم يعد المنتج متوفراً." : "لا توجد منتجات مؤكدة ومتاحة للشراء حالياً."}</h2>
        <a class="primary-button" href="products.html">العودة إلى قائمة المنتجات <span aria-hidden="true">←</span></a>
      </div>`;
    return;
  }

  document.title = `PhoneX | ${product.name}`;
  document.querySelector('meta[name="description"]')?.setAttribute("content", `تعرّف على ${product.name} من PhoneX، واطلع على معلومات المنتج والسعر التقديري وتأكد من توفره عبر WhatsApp.`);
  const specifications = getProductSpecifications(product);
  const description = product.category === "phones"
    ? `${product.name} هاتف ذكي للاستخدام اليومي، بمواصفات من بينها ${product.spec}. تواصل معنا للتأكد من السعة واللون والإصدار المتوفر.`
    : product.category === "audio"
      ? `${product.name} خيار للاستماع إلى الموسيقى وإجراء المكالمات، بالمميزات التالية: ${product.spec}. استفسر عن التوافق والإصدار قبل الطلب.`
      : `${product.name} ساعة ذكية للاستخدام اليومي ومتابعة النشاط، بالمميزات التالية: ${product.spec}. استفسر عن التوافق والخصائص المتوفرة.`;

  detail.innerHTML = `
    <div class="detail-breadcrumbs"><a href="index.html">الرئيسية</a><span>/</span><a href="products.html">المنتجات</a><span>/</span><span>${escapeHtml(product.name)}</span></div>
    <div class="product-detail-layout panel">
      <div class="detail-photo">${productImage(product, "detail-image")}<span class="product-tag">${escapeHtml(product.tag)}</span></div>
      <div class="detail-copy">
        <span class="product-category">${escapeHtml(product.categoryName)}</span>
        <h1>${escapeHtml(product.name)}</h1>
        <p class="detail-summary">${escapeHtml(description)}</p>
        <div class="detail-price">${productPriceMarkup(product)}<span>درهم مغربي · ثمن استرشادي</span></div>
        <div class="availability-note">${product.stockOnHand > 0 ? `متوفر في المخزون: ${product.stockOnHand}` : "نفد المخزون حالياً."}</div>
        <button class="primary-button detail-add" type="button" data-add="${escapeHtml(product.id)}"${product.stockOnHand < 1 ? " disabled" : ""}>أضف للسلة <span aria-hidden="true">←</span></button>
      </div>
    </div>
    <section class="detail-spec-panel panel">
      <div class="panel-heading"><span class="step-number">✦</span><div><h2>معلومات المنتج</h2><p>معلومات أولية تساعدك على الاختيار.</p></div></div>
      <div class="spec-grid">${specifications.map(([label, value]) => `
      <div class="spec-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("")}</div>
      <p class="detail-disclaimer">الصور والمعلومات والأسعار تقريبية للتعريف بالمنتج، وقد تختلف حسب الإصدار والمخزون. أكد كل التفاصيل مع المتجر قبل الطلب.</p>
    </section>`;
}

function renderCart() {
  const badge = document.getElementById("cart-count");
  if (badge) {
    const count = getCartProducts().reduce((total, product) => total + product.quantity, 0);
    badge.textContent = String(count);
  }

  const items = getCartProducts();
  renderContactSelection(items);
  const orderItems = document.getElementById("order-items");
  if (!orderItems) return;
  const total = document.getElementById("order-total");
  if (total) total.textContent = money.format(cartTotal());

  const continueCheckout = document.getElementById("continue-checkout");
  if (continueCheckout) {
    continueCheckout.textContent = items.length ? "متابعة إتمام الطلب ←" : "تصفح المنتجات ←";
    continueCheckout.href = items.length ? "#customer-form" : "products.html";
  }

  if (!items.length) {
    orderItems.innerHTML = '<div class="order-empty">السلة فارغة حالياً. تصفح المنتجات واختر ما يناسبك.</div>';
    return;
  }

  orderItems.innerHTML = items.map(product => `
    <div class="order-item">
      <span class="mini-product">${productImage(product, "mini-product-image")}</span>
      <div class="order-item-name"><strong>${escapeHtml(product.name)}</strong><span>${money.format(product.price)} للوحدة</span></div>
      <div class="quantity-controls" aria-label="كمية ${escapeHtml(product.name)}">
        <button type="button" data-decrease="${escapeHtml(product.id)}" aria-label="تقليل كمية ${escapeHtml(product.name)}">−</button>
        <span>${product.quantity}</span>
        <button type="button" data-increase="${escapeHtml(product.id)}" aria-label="زيادة كمية ${escapeHtml(product.name)}"${product.quantity >= Math.min(99, product.stockOnHand) ? " disabled" : ""}>+</button>
      </div>
      <span class="item-line-total">${money.format(product.price * product.quantity)}</span>
      <button class="remove-item" type="button" data-remove="${escapeHtml(product.id)}">حذف المنتج</button>
    </div>`).join("");
  orderItems.querySelectorAll("button").forEach(button => {
    button.disabled = Boolean(orderReview && !orderReview.hidden || orderSuccess && !orderSuccess.hidden);
  });
}

function renderContactSelection(items) {
  const selection = document.getElementById("contact-selection-items");
  if (!selection) return;
  const total = document.getElementById("contact-selection-total");
  if (total) total.textContent = money.format(items.reduce((sum, product) => sum + product.price * product.quantity, 0));
  if (!items.length) {
    selection.innerHTML = '<p class="contact-selection-empty">لم تختر أي منتجات بعد. <a href="products.html">تصفح المنتجات</a>.</p>';
    return;
  }
  selection.innerHTML = items.map(product => `
    <div class="contact-selection-item">
      <span class="mini-product">${productImage(product, "mini-product-image")}</span>
      <div class="order-item-name"><strong>${escapeHtml(product.name)}</strong><span>الكمية: ${product.quantity} × ${money.format(product.price)}</span></div>
      <strong class="contact-selection-line-total">${money.format(product.price * product.quantity)}</strong>
    </div>`).join("");
}

function observeReveals(elements) {
  for (const element of elements) {
    if (!revealObserver) {
      element.classList.add("is-visible");
    } else {
      revealObserver.observe(element);
    }
  }
}

function createOrder() {
  const formData = new FormData(customerForm);
  const receiptBytes = new Uint8Array(32);
  crypto.getRandomValues(receiptBytes);
  return {
    idempotencyKey: crypto.randomUUID(),
    receiptToken: Array.from(receiptBytes, byte => byte.toString(16).padStart(2, "0")).join(""),
    createdAt: new Date().toISOString(),
    customer: {
      fullName: formData.get("fullName").trim(),
      phone: formData.get("phone").trim(),
      city: formData.get("city").trim(),
      address: formData.get("address").trim(),
      notes: formData.get("notes").trim()
    },
    products: getCartProducts(),
    total: cartTotal()
  };
}

function showOrderReview(order) {
  currentOrder = order;
  document.getElementById("review-full-name").textContent = order.customer.fullName;
  document.getElementById("review-phone").textContent = order.customer.phone;
  document.getElementById("review-city").textContent = order.customer.city;
  document.getElementById("review-address").textContent = order.customer.address;
  document.getElementById("review-notes").textContent = order.customer.notes || "لا توجد ملاحظات";
  document.getElementById("review-total").textContent = money.format(order.total);
  reviewItems.innerHTML = order.products.map(product => `
    <div class="review-item">
      <span class="mini-product">${productImage(product, "mini-product-image")}</span>
      <div class="order-item-name"><strong>${escapeHtml(product.name)}</strong><span>الكمية: ${product.quantity} × ${money.format(product.price)}</span></div>
      <strong class="contact-selection-line-total">${money.format(product.price * product.quantity)}</strong>
    </div>`).join("");
  customerDetails.hidden = true;
  orderReview.hidden = false;
  document.querySelector(".checkout-layout").classList.add("review-only");
  document.querySelector(".order-panel").hidden = true;
  renderCart();
}

function returnToOrderForm() {
  currentOrder = null;
  customerDetails.hidden = false;
  orderReview.hidden = true;
  document.querySelector(".checkout-layout").classList.remove("review-only");
  document.querySelector(".order-panel").hidden = false;
  renderCart();
}

function renderOrderSuccess() {
  if (!orderSuccess || !orderNotFound) return;
  const orderId = queryParams.get("id");
  if (!orderId) {
    orderNotFound.hidden = false;
    return;
  }

  let receiptToken;
  try {
    receiptToken = sessionStorage.getItem(`phonex-order-receipt:${orderId}`);
  } catch (error) {
    console.error("تعذرت قراءة مفتاح إيصال الطلب.", error);
    orderNotFound.hidden = false;
    return;
  }
  if (!receiptToken) {
    orderNotFound.hidden = false;
    return;
  }

  fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
    headers: { "X-Order-Receipt": receiptToken },
    credentials: "same-origin",
    cache: "no-store"
  }).then(async response => {
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.order) {
      throw new Error(result?.error || "تعذر تحميل إيصال الطلب.");
    }
    const order = result.order;
    if (!Array.isArray(order.products) || !order.products.length ||
      !Number.isFinite(Number(order.total_mad)) ||
      order.products.some(product => !product || typeof product.name !== "string" ||
        !Number.isInteger(Number(product.quantity)) || Number(product.quantity) < 1 ||
        !Number.isFinite(Number(product.unitPrice)))) {
      throw new TypeError("بيانات إيصال الطلب غير صالحة.");
    }

    document.getElementById("success-order-id").textContent = order.id;
    document.getElementById("success-order-total").textContent = money.format(Number(order.total_mad));
    const orderItems = document.getElementById("success-order-items");
    orderItems.replaceChildren(...order.products.map(product => {
      const item = document.createElement("div");
      item.className = "review-item";
      const name = document.createElement("span");
      name.textContent = `${product.name} × ${product.quantity}`;
      const price = document.createElement("strong");
      price.textContent = money.format(Number(product.lineTotal));
      item.append(name, price);
      return item;
    }));
    currentOrder = {
      id: order.id,
      total: Number(order.total_mad),
      products: order.products.map(product => ({
        ...product,
        price: Number(product.unitPrice)
      }))
    };
    orderSuccess.hidden = false;
    document.getElementById("send-confirmed-order").addEventListener("click", () => {
      openWhatsApp(createOrderMessage());
    }, { once: true });
  }).catch(error => {
    console.error("تعذر تحميل إيصال الطلب من الخادم.", error);
    orderNotFound.hidden = false;
  });
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => toast.classList.remove("is-visible"), 2400);
}

function normalizeDigits(value) {
  return value.replace(/[٠-٩۰-۹]/g, digit =>
    String(digit.charCodeAt(0) >= 0x06f0 ? digit.charCodeAt(0) - 0x06f0 : digit.charCodeAt(0) - 0x0660)
  );
}

function validateForm(form) {
  let isValid = true;
  const fields = Array.from(form.querySelectorAll("input[required], textarea[required]"));

  for (const field of fields) {
    const value = field.value.trim();
    const error = field.parentElement.querySelector(".field-error");
    let message = "";
    if (!value) {
      message = "هذا الحقل مطلوب.";
    } else if (field.name === "phone") {
      const normalizedPhone = normalizeDigits(value);
      const digits = normalizedPhone.replace(/\D/g, "");
      if (!/^\+?[\d\s().-]+$/.test(normalizedPhone) || digits.length < 9 || digits.length > 15) {
        message = "يرجى إدخال رقم هاتف صحيح.";
      }
    }

    field.setAttribute("aria-invalid", message ? "true" : "false");
    if (error) error.textContent = message;
    if (message) isValid = false;
  }

  const firstInvalid = form.querySelector('[aria-invalid="true"]');
  if (firstInvalid) firstInvalid.focus();
  return isValid;
}

function createOrderMessage() {
  const order = currentOrder;
  const lines = [
    `طلب جديد من متجر PhoneX — رقم الطلب: ${order.id}`,
  ];
  if (order.customer) {
    lines.push(
      "",
      `الاسم الكامل: ${order.customer.fullName}`,
      `رقم الهاتف: ${order.customer.phone}`,
      `المدينة: ${order.customer.city}`,
      `عنوان التوصيل: ${order.customer.address}`
    );
    if (order.customer.notes) lines.push(`ملاحظات إضافية: ${order.customer.notes}`);
  }
  lines.push("", "المنتجات المختارة:");

  order.products.forEach((product, index) => {
    const unitPrice = Number(product.unitPrice ?? product.price);
    lines.push(`${index + 1}. ${product.name} — الكمية: ${product.quantity} — ${money.format(unitPrice * product.quantity)}`);
  });
  lines.push("", `السعر الإجمالي: ${money.format(order.total)} (MAD)`);
  return lines.join("\n");
}

async function confirmOrder() {
  if (!currentOrder || isConfirmingOrder || !validateForm(customerForm)) return;
  if (!currentOrder.products.length || !confirmOrderButton) {
    showToast("السلة فارغة. أضف منتجاً للمتابعة.");
    return;
  }
  if (currentOrder.products.some(product => product.quantity > product.stockOnHand)) {
    showToast("الكمية المطلوبة أكبر من المخزون المتاح. قلّل الكمية قبل التأكيد.");
    returnToOrderForm();
    return;
  }

  isConfirmingOrder = true;
  confirmOrderButton.disabled = true;
  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": currentOrder.idempotencyKey,
        "X-Order-Receipt": currentOrder.receiptToken
      },
      credentials: "same-origin",
      cache: "no-store",
      body: JSON.stringify({
        expectedTotalMad: currentOrder.total,
        customer: currentOrder.customer,
        items: currentOrder.products.map(product => ({
          productId: product.id,
          quantity: product.quantity
        }))
      })
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.order?.id) {
      const error = new Error(result?.error || "تعذر تسجيل الطلب. حاول مرة أخرى.");
      error.status = response.status;
      throw error;
    }
    currentOrder.id = result.order.id;
    currentOrder.total = Number(result.order.total_mad);
    currentOrder.createdAt = result.order.created_at;
    sessionStorage.setItem(`phonex-order-receipt:${currentOrder.id}`, currentOrder.receiptToken);
  } catch (error) {
    console.error("تعذر تسجيل الطلب في قاعدة البيانات.", error);
    if (error.status === 409) {
      returnToOrderForm();
      await loadProductCatalog();
    }
    showToast(error instanceof TypeError
      ? "تعذر الاتصال بالمتجر. تأكد من فتح الموقع عبر خادم PhoneX."
      : error.message);
    isConfirmingOrder = false;
    confirmOrderButton.disabled = false;
    return;
  }

  cart = {};
  try {
    saveCart();
  } catch (error) {
    console.error("تم تسجيل الطلب لكن تعذر تحديث السلة.", error);
  }
  renderCart();
  window.location.href = `order-success.html?id=${encodeURIComponent(currentOrder.id)}`;
}

function createContactMessage(data) {
  const selectedProducts = getCartProducts();
  const lines = [
    "رسالة تواصل من متجر PhoneX",
    "",
    `الاسم الكامل: ${data.get("fullName").trim()}`,
    `رقم الهاتف: ${data.get("phone").trim()}`,
    "المنتجات المختارة:"
  ];
  if (selectedProducts.length) {
    selectedProducts.forEach((product, index) => {
      lines.push(`${index + 1}. ${product.name} — الكمية: ${product.quantity} — ${money.format(product.price * product.quantity)}`);
    });
    lines.push("", `المجموع التقديري: ${money.format(cartTotal())}`);
  } else {
    lines.push("لا توجد منتجات مختارة.");
  }
  const message = data.get("message").trim();
  if (message) lines.push("", `الرسالة: ${message}`);
  return lines.join("\n");
}

function openWhatsApp(message) {
  const url = `https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

document.body.addEventListener("click", event => {
    const card = event.target.closest(".product-card");
    if (card && !event.target.closest("a, button, input, textarea")) {
      const detailsLink = card.querySelector(".product-photo");
      if (detailsLink) window.location.href = detailsLink.href;
      return;
    }

    const button = event.target.closest("[data-add]");
    if (!button) return;
    const product = products.find(item => item.id === button.dataset.add);
    if (!product) return;
    if (product.stockOnHand < 1 || (cart[product.id] || 0) >= Math.min(99, product.stockOnHand)) {
      showToast(product.stockOnHand < 1 ? "نفد المخزون من هذا المنتج." : "الكمية المطلوبة أكبر من المخزون المتاح.");
      return;
    }
    cart[product.id] = (cart[product.id] || 0) + 1;
    saveCart();
    renderCart();
    showToast(`أُضيف ${product.name} إلى السلة`);
});

document.body.addEventListener("keydown", event => {
  const card = event.target.closest(".product-card");
  if (!card || event.target !== card || !["Enter", " "].includes(event.key)) return;
  event.preventDefault();
  const detailsLink = card.querySelector(".product-photo");
  if (detailsLink) window.location.href = detailsLink.href;
});

const orderItems = document.getElementById("order-items");
if (orderItems) {
  orderItems.addEventListener("click", event => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.increase) {
      const id = button.dataset.increase;
      if (cart[id] >= 99) {
        showToast("الحد الأقصى للمنتج هو 99 قطعة.");
        return;
      }
      cart[id] += 1;
    }
    if (button.dataset.decrease) {
      const id = button.dataset.decrease;
      if (cart[id] <= 1) delete cart[id];
      else cart[id] -= 1;
    }
    if (button.dataset.remove) delete cart[button.dataset.remove];
    saveCart();
    renderCart();
  });
}

document.querySelectorAll(".category-filters [data-category]").forEach(button => {
  button.addEventListener("click", () => {
    activeCategory = button.dataset.category;
    document.querySelectorAll(".category-filters [data-category]").forEach(filter => {
      const active = filter === button;
      filter.classList.toggle("active", active);
      filter.setAttribute("aria-pressed", String(active));
    });
    renderProducts();
  });
});

const searchInput = document.getElementById("product-search");
if (searchInput) {
  searchInput.value = queryParams.get("search") || "";
  document.querySelectorAll(".category-filters [data-category]").forEach(button => {
    const active = button.dataset.category === activeCategory;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  searchInput.addEventListener("input", () => {
    searchQuery = searchInput.value.trim().toLocaleLowerCase("ar");
    renderProducts();
  });
}

if (customerForm && customerDetails && orderReview) {
  customerForm.addEventListener("submit", event => {
    event.preventDefault();
    if (!getCartProducts().length) {
      showToast("السلة فارغة. أضف منتجاً للمتابعة.");
      return;
    }
    if (!validateForm(customerForm)) return;
    showOrderReview(createOrder());
  });

  customerForm.addEventListener("input", event => {
    const field = event.target;
    if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) return;
    field.removeAttribute("aria-invalid");
    const error = field.parentElement.querySelector(".field-error");
    if (error) error.textContent = "";
  });

  document.getElementById("back-to-edit").addEventListener("click", returnToOrderForm);
  confirmOrderButton.addEventListener("click", confirmOrder);
}

const contactForm = document.getElementById("contact-form");
if (contactForm) {
  contactForm.addEventListener("submit", event => {
    event.preventDefault();
    if (!validateForm(contactForm)) return;
    const data = new FormData(contactForm);
    const success = document.getElementById("contact-success");
    success.hidden = false;
    success.textContent = "ستُفتح رسالة WhatsApp لمراجعة معلوماتك والمنتجات المختارة قبل إرسالها إلى المتجر.";
    openWhatsApp(createContactMessage(data));
  });

  contactForm.addEventListener("input", event => {
    const field = event.target;
    if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) return;
    field.removeAttribute("aria-invalid");
    const error = field.parentElement.querySelector(".field-error");
    if (error) error.textContent = "";
    document.getElementById("contact-success").hidden = true;
  });
}

window.addEventListener("storage", event => {
  if (event.key !== CART_STORAGE_KEY) return;
  cart = loadCart();
  if (currentOrder && orderSuccess && !orderSuccess.hidden) return;
  if (currentOrder && orderReview && !orderReview.hidden) {
    returnToOrderForm();
    showToast("تغيرت السلة في نافذة أخرى. راجع الطلب من جديد.");
  }
  renderCart();
  renderProducts();
});

document.addEventListener("pointermove", event => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !(event.target instanceof Element)) return;
  const surface = event.target.closest(".product-photo, .detail-photo");
  if (!surface) return;
  const image = surface.querySelector("img");
  if (!image || image.complete && image.naturalWidth === 0) return;
  const bounds = surface.getBoundingClientRect();
  const horizontal = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
  const vertical = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
  const rotateY = (horizontal - 0.5) * 12;
  const rotateX = (0.5 - vertical) * 9;
  image.style.transform = `perspective(850px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.06)`;
  surface.classList.add("is-tilting");
});

const collectionScene = document.querySelector(".hero-collection");
if (collectionScene && !reduceMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
  const collectionCards = [...collectionScene.querySelectorAll(".collection-card")];
  let pointerFrame = 0;
  let pointerX = 0;
  let pointerY = 0;

  collectionScene.addEventListener("pointermove", event => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (pointerFrame) return;

    pointerFrame = window.requestAnimationFrame(() => {
      pointerFrame = 0;
      const bounds = collectionScene.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (pointerX - bounds.left) / bounds.width));
      const y = Math.max(0, Math.min(1, (pointerY - bounds.top) / bounds.height));
      const tiltX = (0.5 - y) * 7;
      const tiltY = (x - 0.5) * 9;
      const layers = [-1, 0.55, 1];

      collectionScene.style.setProperty("--cursor-x", `${x * 100}%`);
      collectionScene.style.setProperty("--cursor-y", `${y * 100}%`);
      collectionScene.classList.add("is-pointer-active");
      collectionCards.forEach((card, index) => {
        const depth = layers[index] || 0;
        card.style.setProperty("--pointer-shift-x", `${(0.5 - x) * 18 * depth}px`);
        card.style.setProperty("--pointer-shift-y", `${(0.5 - y) * 14 * depth}px`);
        card.style.setProperty("--pointer-tilt-x", `${tiltX * depth}deg`);
        card.style.setProperty("--pointer-tilt-y", `${tiltY * depth}deg`);
      });
    });
  });

  collectionScene.addEventListener("pointerleave", () => {
    if (pointerFrame) window.cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
    collectionScene.classList.remove("is-pointer-active");
    collectionScene.style.removeProperty("--cursor-x");
    collectionScene.style.removeProperty("--cursor-y");
    collectionCards.forEach(card => {
      card.style.removeProperty("--pointer-shift-x");
      card.style.removeProperty("--pointer-shift-y");
      card.style.removeProperty("--pointer-tilt-x");
      card.style.removeProperty("--pointer-tilt-y");
    });
  });
}

document.addEventListener("pointerout", event => {
  if (!(event.target instanceof Element)) return;
  const surface = event.target.closest(".product-photo, .detail-photo");
  if (!surface || event.relatedTarget instanceof Node && surface.contains(event.relatedTarget)) return;
  const image = surface.querySelector("img");
  if (image) image.style.removeProperty("transform");
  surface.classList.remove("is-tilting");
});

document.addEventListener("pointerup", event => {
  if (event.pointerType !== "touch" || !(event.target instanceof Element)) return;
  const surface = event.target.closest(".product-photo, .detail-photo");
  if (!surface) return;
  const image = surface.querySelector("img");
  if (image) image.style.removeProperty("transform");
  surface.classList.remove("is-tilting");
});

document.addEventListener("error", event => {
  const image = event.target;
  if (!(image instanceof HTMLImageElement)) return;
  const fallback = image.dataset.fallback;
  if (fallback && image.dataset.fallbackUsed !== "true") {
    image.dataset.fallbackUsed = "true";
    image.src = fallback;
    return;
  }
  if (!image.classList.contains("product-image")) return;
  const surface = image.closest(".product-photo, .detail-photo");
  if (surface) {
    const hint = surface.querySelector(".photo-hint");
    if (hint) hint.textContent = "تعذّر تحميل الصورة";
    surface.classList.add("image-error");
  }
}, true);

document.addEventListener("load", event => {
  if (event.target instanceof HTMLImageElement &&
    event.target.classList.contains("product-image")) {
    event.target.classList.add("is-loaded");
    event.target.closest(".product-photo, .detail-photo")?.classList.add("image-loaded");
  }
}, true);

document.querySelectorAll("main > section:not(.hero), .benefit, .brand-tile").forEach(element => {
  observeReveals([element]);
});

const emailLink = document.getElementById("store-email-link");
if (emailLink) {
  emailLink.href = STORE_EMAIL ? `mailto:${STORE_EMAIL}` : "mailto:";
  const emailLabel = emailLink.querySelector("span");
  if (emailLabel && !STORE_EMAIL) {
    emailLabel.textContent = "البريد الإلكتروني (أضف العنوان)";
    emailLink.setAttribute("aria-label", "البريد الإلكتروني؛ أضف عنوان المتجر في STORE_EMAIL داخل index.js");
  }
}

const backToTop = document.getElementById("back-to-top");
if (backToTop) {
  const updateBackToTop = () => backToTop.classList.toggle("is-visible", window.scrollY > 420);
  window.addEventListener("scroll", updateBackToTop, { passive: true });
  updateBackToTop();
  backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));
}

const currentYear = document.getElementById("current-year");
if (currentYear) currentYear.textContent = String(new Date().getFullYear());
renderCart();
loadProductCatalog();
renderOrderSuccess();
localizePage();

const cursorSpotlightMedia = window.matchMedia("(hover: hover) and (pointer: fine)");
if (cursorSpotlightMedia.matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const cursorSpotlight = document.createElement("div");
  cursorSpotlight.className = "cursor-spotlight";
  cursorSpotlight.setAttribute("aria-hidden", "true");
  document.body.append(cursorSpotlight);

  let pointerFrame = 0;
  let pointerX = 0;
  let pointerY = 0;
  document.addEventListener("pointermove", event => {
    if (event.pointerType === "touch") return;
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (pointerFrame) return;

    pointerFrame = window.requestAnimationFrame(() => {
      pointerFrame = 0;
      cursorSpotlight.style.setProperty("--cursor-spotlight-x", `${pointerX}px`);
      cursorSpotlight.style.setProperty("--cursor-spotlight-y", `${pointerY}px`);
      cursorSpotlight.classList.add("is-visible");
    });
  }, { passive: true });

  document.addEventListener("pointerout", event => {
    if (event.relatedTarget === null) cursorSpotlight.classList.remove("is-visible");
  });
}
