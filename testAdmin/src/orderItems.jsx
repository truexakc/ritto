import {
    List,
    Datagrid,
    TextField,
    ReferenceField
} from 'react-admin';

export const OrderItemsList = () => (
    <List>
        <Datagrid rowClick="show">
            <TextField source="id" />
            <ReferenceField source="order_id" reference="orders" />
            <ReferenceField source="product_id" reference="products" />
            <TextField source="quantity" />
        </Datagrid>
    </List>
);
