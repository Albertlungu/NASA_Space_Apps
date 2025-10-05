import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import sklearn
from sklearn.preprocessing import MinMaxScaler,LabelEncoder
from sklearn.feature_selection import chi2
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier
from sklearn.svm import SVC
from sklearn.naive_bayes import GaussianNB
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier,AdaBoostClassifier,GradientBoostingClassifier
from xgboost import XGBClassifier
from sklearn.metrics import classification_report,accuracy_score
from sklearn.model_selection import GridSearchCV,RandomizedSearchCV
import pickle

df=pd.read_csv('air_quality_health_impact_data.csv')
df.head()

'''
sns.countplot(x='HealthImpactClass', data=df)
plt.title('Distribution of Health Impact Classes')
plt.show()

plt.figure(figsize=(12, 8))
correlation_matrix = df.corr()
sns.heatmap(correlation_matrix, annot=True, cmap='coolwarm')
plt.title('Correlation Heatmap of Features')
plt.show()

plt.figure(figsize=(10, 6))
sns.scatterplot(x='PM2_5', y='RespiratoryCases', hue='HealthImpactClass', palette='viridis', data=df)
plt.title('PM2.5 vs Respiratory Cases')
plt.xlabel('PM2.5')
plt.ylabel('Respiratory Cases')
plt.legend(title='Health Impact Class')
plt.show()

plt.figure(figsize=(10, 6))
sns.scatterplot(x='NO2', y='HospitalAdmissions', hue='HealthImpactClass', palette='coolwarm', data=df)
plt.title('NO2 vs Hospital Admissions')
plt.xlabel('NO2')
plt.ylabel('Hospital Admissions')
plt.legend(title='Health Impact Class')
plt.show()
'''

df.drop('RecordID',axis=1,inplace=True)

df.drop('HealthImpactScore',inplace=True,axis=1)

X = df.iloc[:,:-1]
y = df.iloc[:,-1]

scaler=MinMaxScaler(feature_range=(0,1))
x_scaled=scaler.fit_transform(X)

x_train,x_test,y_train,y_test=train_test_split(x_scaled,y,test_size=0.3,random_state=2)

knn=KNeighborsClassifier()
svc=SVC()
nb=GaussianNB()
dtc=DecisionTreeClassifier()
rdf=RandomForestClassifier()
ada=AdaBoostClassifier()
gdb=GradientBoostingClassifier()
xgb=XGBClassifier()
models=[knn,svc,nb,dtc,ada,gdb,xgb,rdf]

for model in models:
  model.fit(x_train,y_train)
  y_pred1=model.predict(x_test)
  print('\n------Model------\n',model)
  print(classification_report(y_test,y_pred1,zero_division=0))

from imblearn.over_sampling import SMOTE
osl=SMOTE(random_state=1)
x_os,y_os=osl.fit_resample(X,y)

x_os_scaled=scaler.fit_transform(x_os)
x_os_train,x_os_test,y_os_train,y_os_test=train_test_split(x_os_scaled,y_os,random_state=2,test_size=0.3)

for model in models:
  model.fit(x_os_train,y_os_train)
  y_pred2=model.predict(x_os_test)
  print('\n------Model------\n',model)
  print(classification_report(y_os_test,y_pred2,zero_division=0))

features=['AQI', 'PM10', 'PM2_5', 'NO2', 'SO2', 'O3', 'Temperature', 'Humidity','WindSpeed', 'RespiratoryCases', 'CardiovascularCases','HospitalAdmissions']
ch_values,p_values=chi2(x_os_scaled,y_os)
chi2_results = pd.DataFrame({'Feature': features, 'Chi2 Score': ch_values, 'p-value': p_values})
print(chi2_results)

x_os.drop(['RespiratoryCases','CardiovascularCases'],axis=1,inplace=True)

scaler=MinMaxScaler()
x_new_scaled=scaler.fit_transform(x_os)

x_new_train,x_new_test,y_new_train,y_new_test=train_test_split(x_new_scaled,y_os,test_size=0.3,random_state=2)

acc=[]
for model in models:
  model.fit(x_new_train,y_new_train)
  y_pred3=model.predict(x_new_test)
  print('\n------Model------\n',model)
  print(classification_report(y_new_test,y_pred3,zero_division=0))
  acc.append(accuracy_score(y_new_test,y_pred3))

'''
model_names=['knn','svc','nb','dtc','ada','gdb','xgb','rdf']
plt.bar(model_names,acc,color='g')
plt.xlabel('Model Name')
plt.ylabel('Accuracy')
plt.title('Performance Comparison')
plt.show()
'''

params={'n_estimators':[10,50,100],
        'random_state':[1,2,3,4,5],
        "criterion":['gini', 'entropy', 'log_loss']}

clf=RandomizedSearchCV(rdf,params,cv=7,scoring='accuracy')
clf.fit(x_new_train,y_new_train)

pred=clf.predict(x_new_test)
print(classification_report(y_new_test,pred))

cases=['Imbalanced','Balanced','Feature Selection','Hyper-Parameter Tuning']
test=[y_test,y_os_test,y_new_test,y_new_test]
preds=[y_pred1,y_pred2,y_pred3,pred]
scores=[]
for i in range(4):
  scores.append(accuracy_score(test[i],preds[i]))
#plt.title('Random Forest Performance at different Stages')
#plt.bar(cases,scores)
#plt.show()

pickle.dump(clf,open('AirQuality.sav','wb'))
pickle.dump(scaler,open('AQl_scaler.sav','wb'))